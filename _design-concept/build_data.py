# -*- coding: utf-8 -*-
import json, io

base = json.load(io.open('data.json', encoding='utf-8'))
extra = json.load(io.open('extra.json', encoding='utf-8'))

TOPIC_EN = {"drones":"Drones/FPV","logistics":"Logistics","ew":"Electronic warfare","doctrine":"Doctrine",
 "airforce":"Air force","air-defense":"Air defense","mobilization":"Mobilization","missiles":"Missiles"}
TOPIC_NL = {"drones":"Drones/FPV","logistics":"Logistiek","ew":"Elektronische oorlogvoering","doctrine":"Doctrine",
 "airforce":"Luchtmacht","air-defense":"Luchtverdediging","mobilization":"Mobilisatie","missiles":"Raketten"}

def clean(s, n):
    s = ' '.join(s.split())
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '\u2026'

def day(iso):
    m = {"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun","07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"}
    return iso[8:10].lstrip('0') + ' ' + m[iso[5:7]]

out = []
for e in base + extra:
    src = []
    for s in e['src']:
        n = {"meduza-en":"Meduza","pravda-en":"Ukrainska Pravda","kyiv-independent":"Kyiv Independent",
             "euromaidan":"Euromaidan Press","militarnyi":"Militarnyi","nyt":"New York Times",
             "tg-wargonzo":"WarGonzo (TG)","topwar":"Topwar.ru","defexpress":"Defense Express"}.get(s, s)
        if n not in src:
            src.append(n)
    out.append({
        "id": e['id'], "cat": e['cat'], "sig": e['sig'], "flag": e.get('flag'),
        "stream": e['stream'], "milblog": bool(e.get('milblogger')), "origin": e.get('origin'),
        "topics": e['topics'],
        "topicsEn": [TOPIC_EN.get(t, t) for t in e['topics']],
        "topicsNl": [TOPIC_NL.get(t, t) for t in e['topics']],
        "date": day(e['updatedAt']),
        "en": clean(e['en'], 130), "nl": clean(e['nl'], 130),
        "enS": clean(e['enS'], 340), "nlS": clean(e['nlS'], 340),
        "src": src,
    })

CROSS = [
 {"site":"Drone Academy","url":"drone-academy.web.app","tint":"#d9a441","cards":[
   {"name":"Shahed-136 / Geran-2","hits":14,"signals":["scale","variant","perf"]},
   {"name":"Gerbera","hits":8,"signals":["loss","deploy"]},
   {"name":"Lancet-1 / Lancet-3","hits":5,"signals":["loss","perf"]}]},
 {"site":"AirDefense Academy","url":"airdefense-academy.web.app","tint":"#7fa8c9","cards":[
   {"name":"S-400 (SA-21)","hits":11,"signals":["deploy","scale"]},
   {"name":"Tor-M2 (SA-15)","hits":10,"signals":["deploy","scale"]},
   {"name":"Pantsir (SA-22)","hits":7,"signals":["deploy","counter"]}]},
 {"site":"EW Academy","url":"ew-academy.web.app","tint":"#9b8ec4","cards":[
   {"name":"Jamming","hits":14,"signals":["perf","counter"]},
   {"name":"IR-dreiging & DIRCM","hits":8,"signals":["variant","scale"]},
   {"name":"GNSS-denial & spoofing","hits":4,"signals":["loss","counter"]}]},
]

io.open('entries.js.json','w',encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1))
io.open('cross.js.json','w',encoding='utf-8').write(json.dumps(CROSS, ensure_ascii=False, indent=1))
print('entries', len(out))
