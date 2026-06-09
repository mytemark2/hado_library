from pathlib import Path
import json,re,hashlib,urllib.request
root=Path('.'); VERSION='3.0.0.0'; BASE='2.9.6.5'; SUMMARY='Update02: add type score, purpose, role rule and baseline role candidate JSON files.'
def fetch_json(name):
 url='https://raw.githubusercontent.com/mytemark2/hado_library-crawler/refs/heads/feature/crawler-1.1.0.0/spec/'+name
 with urllib.request.urlopen(url,timeout=30) as r: return json.load(r)
def normalize(raw,kind):
 raw=dict(raw); raw['schemaVersion']='1.0'; raw['kind']=kind; raw['releaseVersion']=VERSION; raw['crawlerVersion']='1.1.0.0'; raw['items']=raw.get('items') or raw.get('types') or raw.get('purposes') or raw.get('roles') or []; return raw
score=normalize(fetch_json('hadou_type_score_rules.update01.json'),'type_score_rules')
purpose=normalize(fetch_json('hadou_type_purpose_rules.update01.json'),'type_purpose_rules')
roles=normalize(fetch_json('hadou_type_search_role_rules.update01.json'),'type_search_role_rules')
def load_items(path):
 p=root/path
 if not p.exists(): return []
 d=json.loads(p.read_text(encoding='utf-8'))
 if isinstance(d,list): return d
 for key in ('items','generals','formations','warhorses','warhorse_skills'):
  if isinstance(d.get(key),list): return d[key]
 return []
def name(v): return str(v.get('displayName') or v.get('name') or v.get('title') or '').strip()
catmap={'generals':'generals','equipments':'equipments','formations':'formations','siegeWeapons':'siege_weapons','warhorses':'warhorses','warhorseSkills':'warhorse_skills'}
files={'generals':'hadou_generals.json','equipments':'hadou_equipments.json','formations':'hadou_formations.json','siegeWeapons':'hadou_siege_weapons.json','warhorses':'hadou_warhorses.json','warhorseSkills':'hadou_warhorse_skills.json'}
feature={}; fp=root/'hadou_type_search_feature_index.json'
if fp.exists():
 for v in json.loads(fp.read_text(encoding='utf-8')).get('items',[]): feature[(str(v.get('category','')),name(v))]=v
items=[]; counts={}
for role in roles['items']:
 for source in role.get('sourceCategories',[]):
  for i,raw in enumerate(load_items(files[source])):
   n=name(raw)
   if not n: continue
   cat=catmap[source]; f=feature.get((cat,n),{})
   items.append({'id':f"{role['roleId']}:{cat}:{i}:{n}",'roleId':role['roleId'],'roleLabel':role['label'],'category':cat,'name':n,'displayName':n,'sourceIndex':i,'typeFeatures':f.get('typeFeatures',[]),'statusEffectRefs':f.get('statusEffectRefs',[]),'typeFeatureCount':len(f.get('typeFeatures',[])),'statusEffectRefCount':len(f.get('statusEffectRefs',[])),'sortKeys':role.get('sortKeys',[])})
 counts[role['roleId']]=sum(1 for v in items if v['roleId']==role['roleId'])
role_index={'schemaVersion':'1.0','kind':'type_search_role_index','releaseVersion':VERSION,'crawlerVersion':'1.1.0.0','items':items,'qualityAudit':{'ok':len(roles['items'])==9 and len(items)>0,'roleRuleCount':len(roles['items']),'itemCount':len(items),'roleCounts':counts,'source':'baseline generated from app repository JSON before next browser crawl'}}
for fn,obj in [('hadou_type_score_rules.json',score),('hadou_type_purpose_rules.json',purpose),('hadou_type_search_role_rules.json',roles),('hadou_type_search_role_index.json',role_index)]: (root/fn).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=root/'index.html'; s=p.read_text(encoding='utf-8'); base_sha=hashlib.sha256(s.encode()).hexdigest()
def one(pattern,repl,text,label,flags=0):
 new,n=re.subn(pattern,repl,text,count=1,flags=flags)
 if n!=1: raise SystemExit(f'{label} replacement count={n}')
 return new
s=one(r'<title>覇道ライブラリ\s+[^<]+</title>',f'<title>覇道ライブラリ {VERSION}</title>',s,'title')
m=re.search(r'<h1[^>]*>.*?</h1>',s,re.S)
if not m: raise SystemExit('h1 not found')
h,n=re.subn(r'覇道ライブラリ(?:\s+[^<]+)?','覇道ライブラリ '+VERSION,m.group(0),count=1)
if n!=1: raise SystemExit('h1 version replacement failed')
s=s[:m.start()]+h+s[m.end():]
def replace_prop(text,obj,key,value):
 objm=re.search(r'(?:(?:const|let|var)\s+)?'+re.escape(obj)+r'\s*=\s*\{.*?\}\s*;?',text,re.S)
 if not objm: raise SystemExit(obj+' object not found')
 block=objm.group(0)
 pat=r'(["\']?'+re.escape(key)+r'["\']?\s*:\s*)(["\']).*?\2'
 block2,n=re.subn(pat,lambda mm:mm.group(1)+json.dumps(str(value),ensure_ascii=False),block,count=1,flags=re.S)
 if n!=1: raise SystemExit(f'{obj}.{key} replacement count={n}')
 return text[:objm.start()]+block2+text[objm.end():]
for k,v in {'fileName':'hado_library_3.0.0.0.html','createdAt':'2026-06-06 00:00:00'}.items(): s=replace_prop(s,'FILE_META',k,v)
for k,v in {'version':VERSION,'baseVersion':BASE,'changeType':'feature','summary':SUMMARY,'baseSha256':base_sha}.items(): s=replace_prop(s,'HADO_BUILD_INFO',k,v)
p.write_text(s,encoding='utf-8'); (root/'hado_library_3.0.0.0.html').write_text(s,encoding='utf-8')
(root/'HADO_DEV_INFO.json').write_text(json.dumps({'schemaVersion':'1.0','releaseStatus':'development','releaseVersion':VERSION,'updateNo':'02','revision':0,'displayVersion':'3.0.0.0 Update02.0','baseAppVersion':BASE,'summary':SUMMARY,'updatedAt':'2026-06-06T00:00:00+09:00'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':VERSION,'baseVersion':BASE,'baseSha256':base_sha,'indexSha256':hashlib.sha256(s.encode()).hexdigest(),'scoreTypeCount':len(score['items']),'metricCounts':{v['typeId']:len(v['metrics']) for v in score['items']},'purposeCount':len(purpose['items']),'roleRuleCount':len(roles['items']),'roleIndexItemCount':len(items),'roleCounts':counts}
(root/'report').mkdir(exist_ok=True); (root/'report/HADO_APP_3.0.0.0_UPDATE02_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if report['scoreTypeCount']!=11 or any(v!=5 for v in report['metricCounts'].values()) or report['purposeCount']!=6 or report['roleRuleCount']!=9 or report['roleIndexItemCount']<=0: raise SystemExit('Update02 audit failed')
