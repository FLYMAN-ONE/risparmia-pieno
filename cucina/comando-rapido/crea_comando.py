"""Genera il Comando Rapido "Consegna dati MIMIT" (vedi cucina/COMANDO-RAPIDO.md).
La chiave GitHub NON è qui: Comandi Rapidi la chiede al momento dell'importazione."""
import plistlib, uuid, sys
OBJ = '￼'
def U(): return str(uuid.uuid4()).upper()
def att(u, name): return {'OutputUUID': u, 'OutputName': name, 'Type': 'ActionOutput'}
def attv(name): return {'VariableName': name, 'Type': 'Variable'}
def var(a): return {'Value': a, 'WFSerializationType': 'WFTextTokenAttachment'}
def tok(text, atts=()):
    # Ogni {} nel testo viene sostituito da una variabile (in ordine).
    rng, s = {}, ''
    pieces = text.split('{}')
    for k, p in enumerate(pieces):
        s += p
        if k < len(pieces) - 1:
            posizione = len(s.encode('utf-16-le')) // 2
            rng['{%d, 1}' % posizione] = atts[k]
            s += OBJ
    return {'Value': {'string': s, 'attachmentsByRange': rng}, 'WFSerializationType': 'WFTextTokenString'}
def dic(items):
    return {'Value': {'WFDictionaryFieldValueItems': [
        {'WFItemType': 0, 'WFKey': tok(k), 'WFValue': v if isinstance(v, dict) else tok(v)} for k, v in items]},
        'WFSerializationType': 'WFDictionaryFieldValue'}
def act(ident, **p): return {'WFWorkflowActionIdentifier': 'is.workflow.actions.' + ident, 'WFWorkflowActionParameters': p}

REPO = 'FLYMAN-ONE/risparmia-pieno'
T, D1, N1, D2, N2, Z, DT, FD, UP, DP = (U() for _ in range(10))
base = 'https://www.mimit.gov.it/images/exportCSV/'
auth = tok('Bearer {}', [att(T, 'Testo')])
azioni = [
    act('gettext', UUID=T, WFTextActionText=''),
    act('downloadurl', UUID=D1, WFURL=base + 'anagrafica_impianti_attivi.csv', WFHTTPMethod='GET'),
    act('setitemname', UUID=N1, WFInput=var(att(D1, 'Contenuti dell\'URL')), WFName='anagrafica_impianti_attivi.csv'),
    act('appendvariable', WFInput=var(att(N1, 'File rinominato')), WFVariableName='File'),
    act('downloadurl', UUID=D2, WFURL=base + 'prezzo_alle_8.csv', WFHTTPMethod='GET'),
    act('setitemname', UUID=N2, WFInput=var(att(D2, 'Contenuti dell\'URL')), WFName='prezzo_alle_8.csv'),
    act('appendvariable', WFInput=var(att(N2, 'File rinominato')), WFVariableName='File'),
    act('makezip', UUID=Z, WFInput=var(attv('File')), WFZIPName='mimit', WFArchiveFormat='.zip'),
    act('date', UUID=DT, WFDateActionMode='Current Date'),
    act('format.date', UUID=FD, WFDateFormatStyle='Custom', WFDateFormat='yyyyMMdd-HHmm',
        WFDate=tok('{}', [att(DT, 'Data')])),
    act('downloadurl', UUID=UP, ShowHeaders=True, WFHTTPMethod='POST',
        WFURL=tok(f'https://uploads.github.com/repos/{REPO}/releases/450208372/assets?name=mimit-{{}}.zip', [att(FD, 'Data formattata')]),
        WFHTTPHeaders=dic([('Authorization', auth), ('Accept', 'application/vnd.github+json'), ('Content-Type', 'application/zip')]),
        WFHTTPBodyType='File', WFRequestVariable=var(att(Z, 'Archivio'))),
    act('downloadurl', UUID=DP, ShowHeaders=True, WFHTTPMethod='POST',
        WFURL=f'https://api.github.com/repos/{REPO}/actions/workflows/ricevi-dati.yml/dispatches',
        WFHTTPHeaders=dic([('Authorization', auth), ('Accept', 'application/vnd.github+json')]),
        WFHTTPBodyType='JSON', WFJSONValues=dic([('ref', 'main')])),
    act('gettext', WFTextActionText=tok('Consegna: {}', [att(UP, 'Contenuti dell\'URL')])),
]
wf = {
    'WFWorkflowMinimumClientVersion': 900, 'WFWorkflowMinimumClientVersionString': '900',
    'WFWorkflowClientVersion': '2605.0.5',
    'WFWorkflowIcon': {'WFWorkflowIconStartColor': 4282601983, 'WFWorkflowIconGlyphNumber': 59446},
    'WFWorkflowTypes': [], 'WFWorkflowInputContentItemClasses': [], 'WFWorkflowOutputContentItemClasses': [],
    'WFWorkflowHasOutputFallback': False, 'WFWorkflowHasShortcutInputVariables': False,
    'WFWorkflowImportQuestions': [{'ActionIndex': 0, 'Category': 'Parameter', 'DefaultValue': '',
        'ParameterKey': 'WFTextActionText', 'Text': 'Incolla la chiave GitHub (inizia con github_pat_)'}],
    'WFWorkflowActions': azioni,
}
with open(sys.argv[1], 'wb') as f: plistlib.dump(wf, f, fmt=plistlib.FMT_BINARY)
print('ok', len(azioni), 'azioni')
