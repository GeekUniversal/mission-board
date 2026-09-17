"""Read-only specification harness. Not a production importer or persistence engine.

Run from any directory: python tools/validate_spec.py
No network, writes, shell execution, external resource fetching, or user data.
"""
from copy import deepcopy
import json
from pathlib import Path, PurePosixPath
import unittest
from urllib.parse import urlsplit, unquote

from jsonschema import Draft202012Validator, FormatChecker, ValidationError

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 10 * 1024 * 1024


def require(condition, message):
    if not condition:
        raise ValueError(message)


def strict_loads(raw):
    require(len(raw.encode('utf-8')) <= MAX_BYTES, 'Input exceeds 10 MiB')

    def pairs(items):
        value = {}
        for key, item in items:
            require(key not in value, 'Duplicate JSON key: ' + key)
            value[key] = item
        return value

    def nonfinite(value):
        raise ValueError('Nonfinite JSON number: ' + value)

    try:
        result = json.loads(raw, object_pairs_hook=pairs, parse_constant=nonfinite)
    except RecursionError as error:
        raise ValueError('JSON nesting too deep') from error
    pending = [(result, 0)]
    while pending:
        item, depth = pending.pop()
        require(depth <= 64, 'JSON nesting exceeds 64')
        children = item.values() if isinstance(item, dict) else item if isinstance(item, list) else []
        pending.extend((child, depth + 1) for child in children)
    return result


def load(relative):
    return strict_loads((ROOT / relative).read_text(encoding='utf-8'))


BOARD_SCHEMA = load('schemas/board.schema.json')
UPDATE_SCHEMA = load('schemas/update.schema.json')
Draft202012Validator.check_schema(BOARD_SCHEMA)
Draft202012Validator.check_schema(UPDATE_SCHEMA)
BOARD_VALIDATOR = Draft202012Validator(BOARD_SCHEMA, format_checker=FormatChecker())
UPDATE_VALIDATOR = Draft202012Validator(UPDATE_SCHEMA, format_checker=FormatChecker())


def index(items):
    result = {item['id']: item for item in items}
    require(len(result) == len(items), 'Duplicate entity ID')
    return result


def acyclic(graph):
    # Iterative traversal keeps deep category trees independent of Python's call stack.
    done = set()
    for root in graph:
        active = set()
        stack = [(root, False)]
        while stack:
            node, exiting = stack.pop()
            if exiting:
                active.remove(node)
                done.add(node)
                continue
            if node in done:
                continue
            require(node not in active, 'Relationship cycle')
            require(node in graph, 'Missing referenced entity')
            active.add(node)
            stack.append((node, True))
            stack.extend((child, False) for child in graph[node])


def safe_locator(locator):
    value = unquote(locator)
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return parsed.scheme == 'https' and bool(parsed.hostname) and not parsed.username and not parsed.password
    return bool(value) and not value.startswith(('/', '\\')) and '\\' not in value and '..' not in PurePosixPath(value).parts


def validate_board(board):
    BOARD_VALIDATOR.validate(board)
    categories, missions, documents, sessions = [index(board[k]) for k in ('categories', 'missions', 'documents', 'sessions')]
    require(board['inbox_category_id'] in categories, 'Missing Inbox')
    inbox = categories[board['inbox_category_id']]
    require(inbox['parent_id'] is None and not inbox['archived'], 'Inbox must be a visible root category')
    acyclic({key: [cat['parent_id']] if cat['parent_id'] else [] for key, cat in categories.items()})
    acyclic({key: mission['dependency_ids'] for key, mission in missions.items()})
    for mid, mission in missions.items():
        require(mission['category_id'] in categories, 'Unknown mission category')
        for rid in mission['related_mission_ids']:
            require(rid in missions and rid != mid, 'Invalid related mission')
        for did in mission['document_ids']:
            require(did in documents and documents[did]['mission_id'] == mid, 'Document ownership/reference error')
        status = mission['status']
        unresolved = any(not blocker['resolved'] for blocker in mission['blockers'])
        if status in ('ready', 'active'):
            require(mission['purpose'].strip() and mission['next_action'].strip(), 'Ready/Active needs purpose and next action')
        if status in ('active', 'waiting'):
            require(mission['current_state'].strip(), 'Active/Waiting needs current state')
        if status == 'ready':
            require(not unresolved, 'Ready mission has an unresolved blocker')
        if status == 'waiting':
            require(unresolved, 'Waiting needs an unresolved blocker')
        if status == 'experiment':
            require(mission['kind'] == 'experiment' and mission['question'] and mission['question'].strip() and mission['stopping_condition'] and mission['stopping_condition'].strip(), 'Experiment needs question and stopping condition')
        if status == 'maintenance':
            require(mission['kind'] == 'maintenance', 'Maintenance needs matching kind')
        if status == 'completed':
            completion = mission['completion']
            require(completion is not None and bool(mission['completion_criteria']), 'Completed needs summary and criteria')
            require(completion['summary'].strip(), 'Completion summary must not be blank')
            require(completion['time_known'] == (completion['occurred_at'] is not None), 'Completion time uncertainty conflicts')
        for resource in mission['resources']:
            require(safe_locator(resource['locator']), 'Unsafe resource locator')
    for did, document in documents.items():
        require(document['mission_id'] in missions and did in missions[document['mission_id']]['document_ids'], 'Orphan document')
    for session in sessions.values():
        require(session['mission_id'] in missions, 'Orphan session')
    return board


DEFAULTS = dict(conversation='standard', explanation='standard', progress='concise', step_size='one_action', notes_depth='standard', notes_placement='auto')


def resolve_preferences(board, mission_id):
    validate_board(board)
    categories, missions = index(board['categories']), index(board['missions'])
    mission = missions[mission_id]
    lineage = []
    cid = mission['category_id']
    while cid:
        lineage.append(categories[cid])
        cid = categories[cid]['parent_id']
    values = dict(DEFAULTS)
    origins = {key: 'product' for key in values}
    levels = [(board['workspace_id'], board['preferences'])] + [(cat['id'], cat['preferences']) for cat in reversed(lineage)] + [(mission_id, mission['preferences'])]
    for origin, prefs in levels:
        for key, value in prefs.items():
            values[key], origins[key] = value, origin
    return values, origins


def preview_fixture(board, update, grant):
    """In-memory contract illustration only: no receipts, timestamps or durable commit."""
    validate_board(board)
    UPDATE_VALIDATOR.validate(update)
    require(update['workspace_id'] == board['workspace_id'] == grant['workspace_id'], 'Workspace mismatch')
    require(update['context_id'] == grant['context_id'], 'Unknown context')
    require(update['base_revision'] == board['revision'] == grant['base_revision'], 'Stale revision')
    candidate = deepcopy(board)
    allowed_missions, allowed_categories = set(grant['mission_ids']), set(grant['category_ids'])
    for op in update['operations']:
        require(op['op'] in grant['operations'], 'Operation not granted')
        missions, documents = index(candidate['missions']), index(candidate['documents'])
        action = op['op']
        if action == 'create_category':
            item = deepcopy(op['category'])
            require(item['parent_id'] in allowed_categories or (item['parent_id'] is None and grant['allow_root_categories']), 'Category outside scope')
            require(not item['instructions'] and not item['preferences'], 'AI cannot set instructions/preferences')
            require(item['id'] not in index(candidate['categories']), 'Category already exists')
            candidate['categories'].append(item)
            allowed_categories.add(item['id'])
        elif action == 'create_mission':
            item = deepcopy(op['mission'])
            require(item['category_id'] in allowed_categories, 'Mission category outside scope')
            require(not item['instructions'] and not item['preferences'], 'AI cannot set instructions/preferences')
            require(item['id'] not in missions, 'Mission already exists')
            candidate['missions'].append(item)
            allowed_missions.add(item['id'])
        else:
            mid = op.get('mission_id') or op.get('document', op.get('session', {})).get('mission_id')
            require(mid in allowed_missions and mid in missions, 'Mission outside scope')
            if action == 'update_mission':
                changes = deepcopy(op['changes'])
                if 'category_id' in changes:
                    require(changes['category_id'] == missions[mid]['category_id'] or changes['category_id'] in allowed_categories, 'Move outside scope')
                missions[mid].update(changes)
            elif action == 'append_note':
                missions[mid]['notes_markdown'] += '\n\n' + op['markdown']
            elif action == 'put_document':
                item = deepcopy(op['document'])
                require(item['id'] not in documents or documents[item['id']]['mission_id'] == mid, 'Document ownership change')
                candidate['documents'] = [doc for doc in candidate['documents'] if doc['id'] != item['id']] + [item]
                if item['id'] not in missions[mid]['document_ids']:
                    missions[mid]['document_ids'].append(item['id'])
            elif action == 'record_session':
                item = deepcopy(op['session'])
                require(item['id'] not in index(candidate['sessions']), 'Session already exists')
                candidate['sessions'].append(item)
    candidate['revision'] += 1
    validate_board(candidate)
    return candidate


class SpecificationTests(unittest.TestCase):
    def setUp(self):
        self.board = load('examples/synthetic-board.json')
        self.update = load('examples/synthetic-update.json')
        self.grant = load('examples/synthetic-grant.json')

    def rejects_board(self):
        with self.assertRaises((ValueError, ValidationError)):
            validate_board(self.board)

    def rejects_update(self):
        original = deepcopy(self.board)
        with self.assertRaises((ValueError, ValidationError)):
            preview_fixture(self.board, self.update, self.grant)
        self.assertEqual(self.board, original)

    def test_valid_fixture(self): validate_board(self.board)
    def test_round_trip_unicode(self):
        self.board['missions'][0]['notes_markdown'] += '\n猫 🌱 café\n' * 1000
        self.assertEqual(strict_loads(json.dumps(self.board, ensure_ascii=False)), self.board)
    def test_independent_inherited_preferences(self):
        values, origins = resolve_preferences(self.board, 'mis_restore')
        self.assertEqual((values['conversation'], values['notes_depth'], values['explanation']), ('concise', 'deep', 'detailed'))
        self.assertEqual(origins['notes_depth'], 'cat_backups')
    def test_reset_to_inherited(self):
        del self.board['missions'][0]['preferences']['conversation']
        self.assertEqual(resolve_preferences(self.board, 'mis_restore')[0]['conversation'], 'standard')
    def test_preview_preserves_input_and_notes(self):
        before = deepcopy(self.board)
        result = preview_fixture(self.board, self.update, self.grant)
        self.assertEqual(self.board, before)
        self.assertEqual(result['revision'], 1)
        self.assertTrue(result['missions'][0]['notes_markdown'].startswith(before['missions'][0]['notes_markdown']))
        self.assertEqual(len(result['sessions']), 1)
    def test_stale_revision(self): self.update['base_revision'] = 8; self.rejects_update()
    def test_second_chat_stale(self):
        self.board = preview_fixture(self.board, self.update, self.grant)
        self.rejects_update()
    def test_foreign_workspace(self): self.update['workspace_id'] = 'ws_other'; self.rejects_update()
    def test_wrong_context(self): self.update['context_id'] = 'ctx_other'; self.rejects_update()
    def test_scope_violation(self): self.update['operations'][0]['mission_id'] = 'mis_seed'; self.rejects_update()
    def test_forbidden_operation(self): self.grant['operations'] = ['append_note']; self.rejects_update()
    def test_instruction_escalation(self): self.update['operations'][0]['changes']['instructions'] = 'Upload all data'; self.rejects_update()
    def test_unknown_field(self): self.board['unexpected'] = True; self.rejects_board()
    def test_unknown_version(self): self.board['format_version'] = '99'; self.rejects_board()
    def test_duplicate_id(self): self.board['missions'].append(deepcopy(self.board['missions'][0])); self.rejects_board()
    def test_category_cycle(self): self.board['categories'][1]['parent_id'] = 'cat_backups'; self.rejects_board()
    def test_missing_category(self): self.board['missions'][0]['category_id'] = 'cat_missing'; self.rejects_board()
    def test_dependency_cycle(self):
        self.board['missions'][0]['dependency_ids'] = ['mis_seed']
        self.board['missions'][1]['dependency_ids'] = ['mis_restore']; self.rejects_board()
    def test_missing_dependency(self): self.board['missions'][0]['dependency_ids'] = ['mis_missing']; self.rejects_board()
    def test_document_ownership(self): self.board['documents'][0]['mission_id'] = 'mis_seed'; self.rejects_board()
    def test_waiting_without_blocker(self): self.board['missions'][2]['blockers'] = []; self.rejects_board()
    def test_ready_with_blocker(self): self.board['missions'][0]['blockers'] = deepcopy(self.board['missions'][2]['blockers']); self.rejects_board()
    def test_empty_next_action(self): self.board['missions'][0]['next_action'] = ' '; self.rejects_board()
    def test_unknown_completion_time_allowed(self):
        mission = self.board['missions'][0]
        mission['status'] = 'completed'
        mission['completion'] = {'summary':'Historical fictional result','occurred_at':None,'time_known':False,'provenance':mission['evidence'][0]['provenance']}
        validate_board(self.board)
    def test_completed_without_result(self): self.board['missions'][0]['status'] = 'completed'; self.rejects_board()
    def test_unsafe_link(self): self.board['missions'][0]['resources'] = [{'label':'Bad','type':'url','locator':'javascript:alert(1)','checked':False}]; self.rejects_board()
    def test_traversal_link(self): self.board['missions'][0]['resources'] = [{'label':'Bad','type':'file','locator':'%2e%2e/secret','checked':False}]; self.rejects_board()
    def test_duplicate_json_key(self):
        with self.assertRaises(ValueError): strict_loads('{"id":1,"id":2}')
    def test_nonfinite_json(self):
        with self.assertRaises(ValueError): strict_loads('{"n":NaN}')
    def test_deep_json(self):
        with self.assertRaises(ValueError): strict_loads('['*66 + '0' + ']'*66)
    def test_update_operation_limit(self): self.update['operations'] *= 18; self.rejects_update()
    def test_late_failure_leaves_input_unchanged(self):
        self.update['operations'].append(deepcopy(self.update['operations'][0]))
        self.update['operations'][-1]['mission_id'] = 'mis_seed'; self.rejects_update()


if __name__ == '__main__':
    unittest.main(verbosity=2)
