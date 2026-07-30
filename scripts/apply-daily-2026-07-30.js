// One-off script: merge the 2026-07-30 daily analysis batch into public/analysis.json
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'public', 'analysis.json');
const RUN_TS = '2026-07-30T07:00:00.000Z';
const FIRST_SEEN = '2026-07-30';

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

function findEntry(id) {
  const e = data.entries.find(x => x.id === id);
  if (!e) throw new Error('entry not found: ' + id);
  return e;
}

// ---------- NEW ENTRIES ----------
const newEntries = [];

newEntries.push({
  id: 'e-20260730-01',
  stream: 'verified',
  origin: null,
  category: 'ttp',
  topics: ['missiles', 'drones', 'air-defense'],
  title: "Russia launches combined missile and drone barrage on Kyiv, Lviv, Kryvyi Rih and Poltava Oblast; Zelensky cites critical air-defence missile shortage",
  titleNl: "Rusland lanceert gecombineerde raket- en drone-aanval op Kyiv, Lviv, Kryvyi Rih en Poltava-oblast; Zelensky wijst op kritiek tekort aan luchtafweerraketten",
  sourceRefs: [
    { itemId: '8046494', title: 'Russia launches combined missile and drone attack: air defence downs 320 assets, hits recorded at 20 sites', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046494', source: 'pravda-en', date: '2026-07-30T06:09:00.000Z' },
    { itemId: '8046512', title: "Ukraine's power grid operator reports impact of Russia's latest massive attack on energy system", url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046512', source: 'pravda-en', date: '2026-07-30T08:08:00.000Z' },
    { itemId: 'meduza-kryvyi-rih-family', title: 'At least six members of one family killed in Russian missile strike near Kryvyi Rih. Rescue workers are still searching the rubble for three more people.', url: 'https://meduza.io/en/feature/2026/07/30/at-least-six-members-of-one-family-killed-in-russian-missile-strike-near-kryvyi-rih-rescue-workers-are-still-searching-the-rubble-for-three-more-people', source: 'meduza-en', date: '2026-07-30T13:24:55.000Z' },
    { itemId: '8046552', title: "Man's body found under rubble of five-storey building in Lviv after Russian missile strike – photos", url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046552', source: 'pravda-en', date: '2026-07-30T12:49:00.000Z' },
    { itemId: '8046537', title: 'Russian missile strike near Kryvyi Rih: death toll stands at six, number injured rises to nine', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046537', source: 'pravda-en', date: '2026-07-30T11:28:00.000Z' },
    { itemId: '8046515', title: 'Over 56,000 people sheltered in Kyiv metro overnight – metro denies restricting access', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046515', source: 'pravda-en', date: '2026-07-30T08:46:00.000Z' },
    { itemId: '8046511', title: 'Day of mourning declared in Kryvyi Rih', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046511', source: 'pravda-en', date: '2026-07-30T08:01:00.000Z' },
    { itemId: 'meduza-strikes-kyiv-lviv-kryvyi-rih', title: 'Russia strikes Kyiv, Lviv, and Kryvyi Rih with missiles; at least two children among the dead', url: 'https://meduza.io/en/news/2026/07/30/russia-strikes-kyiv-lviv-and-kryvyi-rih-with-missiles-at-least-two-children-among-the-dead', source: 'meduza-en', date: '2026-07-30T07:25:13.000Z' },
    { itemId: '8046504', title: 'Missile directly hit residential building in Lviv but did not explode, mayor says', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046504', source: 'pravda-en', date: '2026-07-30T06:55:00.000Z' },
    { itemId: '8046474', title: 'One killed and two injured in Russian attack on Kyiv – photos', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046474', source: 'pravda-en', date: '2026-07-30T04:17:00.000Z' },
    { itemId: '8046482', title: 'Rescue operation continues after Russian missile strike on Lviv: 15 injured – videos', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046482', source: 'pravda-en', date: '2026-07-30T04:08:00.000Z' },
    { itemId: '8046481', title: 'One killed in Russian drone strike on Poltava Oblast, Nova Poshta hub catches fire', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046481', source: 'pravda-en', date: '2026-07-30T03:54:00.000Z' },
    { itemId: '8046478', title: 'Russian missile attack damages residential buildings in Lviv, leaves people injured – photo', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046478', source: 'pravda-en', date: '2026-07-30T02:42:00.000Z' },
    { itemId: '8046499', title: 'Zelenskyy: eight people killed in Russian attack, critical shortage of air defence missiles', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046499', source: 'pravda-en', date: '2026-07-30T06:34:00.000Z' },
  ],
  nlSummary: `Rusland voerde in de nacht van 29 op 30 juli 2026 een grootschalige gecombineerde aanval uit op Oekraïne, met inzet van raketten en aanvalsdrones vanaf lucht-, land- en zeeplatforms. Volgens de Oekraïense luchtmacht werden 358 doelen gedetecteerd: 74 raketten (4 Zircon/Oniks-antischeepsraketten, 9 Iskander-M/S-400/KN-23-ballistische raketten en 61 Kh-101/Kalibr-kruisraketten) en 284 aanvalsdrones (Shahed, Gerbera, Italmas en Parodiya-lokdrones). Rond 09:00 uur meldde de luchtmacht 320 neergehaalde of verstoorde doelen (55 raketten, 265 drones) — de aanval was op dat moment nog gaande, dus het eindcijfer kon nog oplopen. Inslagen werden geregistreerd op 20 locaties (3 antischeepsraketten, 6 ballistische raketten, 2 kruisraketten, 17 drones), met daarnaast neervallend puin op nog eens 13 plekken. Hoofddoelen waren Kyiv- en Lviv-oblast, met aanvullende treffers in Dnipropetrovsk-, Sumy-, Vinnytsia-, Poltava-, Mykolaiv-, Ivano-Frankivsk-, Kharkiv- en Cherkasy-oblast.

De zwaarste slachtoffers vielen bij de hromada Novopillia nabij het dorp Radushne, net buiten Kryvyi Rih: een Iskander-M-raket trof een privéwoning van de familie Voronov rechtstreeks. De bevestigde dodentol staat op zes, onder wie drie kinderen; twee andere kinderen werden levend uit het puin gehaald. Het aantal gewonden liep op tot negen. Reddingswerkers zochten nog naar mogelijk vermiste personen en DNA-onderzoek naar de gevonden resten liep nog, waardoor het dodental kon oplopen; Kryvyi Rih riep 31 juli uit tot rouwdag. In Lviv sloeg een raket rechtstreeks in op een woongebouw aan de Vyhovskoho-straat maar ontplofte niet — de kop werd door explosievenexperts onschadelijk gemaakt en negen mensen werden uit het puin gered. Een andere raketinslag verwoestte elders in de stad een vijf verdiepingen tellend gebouw, waar het lichaam van een man onder het puin werd gevonden. Het totaal aantal gewonden in Lviv liep op tot rond de 34. In Kyiv kwam één persoon om het leven en raakten twee mensen gewond door vallend puin en branden; meer dan 56.000 mensen brachten de nacht door in de Kyiv-metro. In Poltava-oblast doodde een drone-inslag op een particulier opslagcomplex één persoon; ook een sorteercentrum van pakketbezorger Nova Poshta werd geraakt en vloog in brand, maar dit werd snel geblust zonder verdere slachtoffers.

President Zelensky meldde acht doden in totaal in het hele land en tientallen gewonden, en stelde dat er meer dan 70 raketten (grotendeels ballistisch) en meer dan 280 drones werden ingezet, waarvan er meer dan 260 werden onderschept. Hij benadrukte een "kritiek tekort" aan luchtafweerraketten van bondgenoten en noemde vertraagde levering van antiballistische raketten een directe oorzaak van de verwoesting en slachtoffers van deze aanval, met een oproep aan partners om sneller te leveren. Netbeheerder Ukrenergo meldde noodstroomuitval als gevolg van de aanval, het zwaarst in Sumy-oblast en omliggende gemeenschappen, met nieuwe uitval ook in Donetsk-, Dnipropetrovsk-, Kharkiv-, Zhytomyr- en Cherkasy-oblast.`,
  enSummary: `On the night of 29-30 July 2026, Russia carried out a large-scale combined attack on Ukraine using missiles and attack drones launched from air, land and sea platforms. Ukraine's Air Force detected 358 aerial assets in total: 74 missiles (4 Zircon/Oniks anti-ship missiles, 9 Iskander-M/S-400/KN-23 ballistic missiles and 61 Kh-101/Kalibr cruise missiles) and 284 attack drones (Shahed, Gerbera, Italmas and Parodiya decoys). As of roughly 09:00, air defence had shot down or jammed 320 of these (55 missiles, 265 drones) — the barrage was still ongoing at that point, so the final tally was expected to rise. Impacts were recorded at 20 sites (3 anti-ship missiles, 6 ballistic missiles, 2 cruise missiles, 17 drones), with debris from intercepted weapons falling at a further 13 locations. Kyiv and Lviv oblasts bore the brunt, with additional strikes in Dnipropetrovsk, Sumy, Vinnytsia, Poltava, Mykolaiv, Ivano-Frankivsk, Kharkiv and Cherkasy oblasts.

The deadliest strike hit the Novopillia hromada near the village of Radushne outside Kryvyi Rih, where an Iskander-M ballistic missile scored a direct hit on the home of the Voronov family. The confirmed death toll there stands at six, including three children, while two other children were pulled from the rubble alive. The number of injured rose to nine. Rescue crews continued searching for people still believed missing, and DNA testing of recovered remains was ongoing, meaning the toll could still climb; Kryvyi Rih declared 31 July a day of mourning. In Lviv, a missile struck a residential building on Vyhovskoho Street directly but failed to detonate — bomb disposal teams defused the warhead, and nine people were rescued from the rubble there. A separate missile strike destroyed another five-storey building elsewhere in the city, where a man's body was later recovered from the debris. Total injuries in Lviv climbed to around 34. In Kyiv, one person was killed and two others injured by falling debris and fires across the capital; more than 56,000 people sheltered in the Kyiv metro overnight. In Poltava Oblast, a drone strike on private warehouse facilities killed one person; a Nova Poshta parcel hub was also hit and caught fire but was quickly extinguished with no further casualties.

President Zelensky reported eight people killed nationwide in total, with dozens more injured, and said Russia had used more than 70 missiles (mostly ballistic) and over 280 drones, of which more than 260 were intercepted. He stressed a "critical shortage" of air-defence missiles from partners, calling delayed delivery of anti-ballistic missile assistance a direct contributor to the destruction and casualties from this attack, and appealed to allies to speed up deliveries. Grid operator Ukrenergo reported emergency power outages resulting from the attack, worst in Sumy Oblast and surrounding communities, with new outages also recorded in Donetsk, Dnipropetrovsk, Kharkiv, Zhytomyr and Cherkasy oblasts.`,
  significance: 3,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T02:42:00.000Z',
});

newEntries.push({
  id: 'e-20260730-02',
  stream: 'verified',
  origin: null,
  category: 'org',
  topics: ['missiles', 'command'],
  title: "Suspected Russian Kh-101 missile crashes in Poland's Lublin region, prompting NATO response",
  titleNl: "Vermoedelijke Russische Kh-101-raket stort neer in Poolse regio Lublin, NAVO reageert",
  sourceRefs: [
    { itemId: 'pravda-poland-missile-govt', title: 'Polish government believes it was a Russian missile that fell in Lublin Voivodeship', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046502', source: 'pravda-en', date: '2026-07-30T06:42:00.000Z' },
    { itemId: 'pravda-poland-kh101-footage', title: 'Polish media outlet releases footage of object identified by Ukraine as Russian Kh-101 falling in Lublin Voivodeship', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046513', source: 'pravda-en', date: '2026-07-30T08:23:00.000Z' },
    { itemId: 'pravda-tusk-not-target', title: "Polish PM Tusk doesn't believe Poland was Russia's intended target", url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046540', source: 'pravda-en', date: '2026-07-30T11:33:00.000Z' },
    { itemId: 'pravda-nato-poland-missile', title: 'NATO comments on violation of Polish airspace by missile', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046550', source: 'pravda-en', date: '2026-07-30T12:46:00.000Z' },
  ],
  nlSummary: `In de nacht van 29 op 30 juli, tijdens een grootschalige Russische luchtaanval op Oekraïne (zie de aparte tracker-entry over die aanvalsgolf), drong een onbekend object het Poolse luchtruim binnen en kwam neer bij het dorp Tarnawa-Kolonia in de woiwodschap Lublin, waar het een krater achterliet. Bewoners meldden explosies te hebben gehoord en er klonk luchtalarm in de regio. Een bewakingscamera in de gemeente Turobin, zo'n 8 kilometer verderop, filmde om 03:45 uur lokale tijd een felle explosie. Oekraïens minister van Buitenlandse Zaken Andrii Sybiha identificeerde het object als een Russische Kh-101-kruisraket; de Poolse regering sloot zich bij die duiding aan ("alles wijst op een Russische raket"), maar op het moment van de eerste berichtgeving onderzochten explosievenexperts het object nog fysiek ter plaatse, dus de Kh-101-identificatie berustte vooralsnog op de Oekraïense en Poolse politieke inschatting, niet op een onafhankelijk forensisch bevestigde vaststelling.

De Poolse regering annuleerde een gepland werkbezoek van premier Donald Tusk en minister van Defensie Władysław Kosiniak-Kamysz sprak van een "extreem zware nacht" voor de Poolse luchtverdediging. Tusk reisde vervolgens zelf naar de inslagplaats en bevestigde dat alles erop wees dat het om een Russische Kh-101 ging. Hij benadrukte echter dat er "geen aanwijzingen zijn dat Polen het beoogde doelwit was", en waarschuwde dat Rusland "alles zal doen om verantwoordelijkheid te ontlopen." Volgens Tusk toonden ook de Verenigde Staten interesse om deel te nemen aan het onderzoek naar de schending van het Poolse luchtruim.

NAVO liet via een woordvoerder van SHAPE weten nauw contact te onderhouden met de Poolse autoriteiten. Polen en de NAVO activeerden hun lucht- en grondverdedigingssystemen: twee Poolse F-16's werden gescrambled, samen met een NAVO-tankvliegtuig, een Poolse Saab 340 AEW&C-toestel en een Poolse Mi-24-helikopter. NAVO's Supreme Allied Commander Europe, generaal Alexus Grynkewich, belde met de Poolse chef defensiestaf Wiesław Kukuła over de gezamenlijke respons. Het incident sluit aan bij een patroon van herhaalde schendingen van het NAVO-luchtruim aan de oostflank tijdens Russische massale aanvallen op Oekraïne — vergelijkbaar met eerdere Roemeense onderscheppingen van afgedwaalde Russische drones — en onderstreept het risico dat Russisch wapentuig, al dan niet bedoeld, NAVO-grondgebied raakt.`,
  enSummary: `During the night of 29–30 July, amid a large-scale Russian air attack on Ukraine (see the separate tracker entry on that barrage), an unidentified object entered Polish airspace and crashed near the village of Tarnawa-Kolonia in the Lublin Voivodeship, leaving a crater. Local residents reported hearing explosions and air-raid sirens sounded across the region. CCTV footage recorded by a camera in the Turobin gmina, roughly 8 km from the impact site, captured a powerful explosion at 03:45 local time. Ukraine's Foreign Minister Andrii Sybiha identified the object as a Russian Kh-101 cruise missile, and the Polish government leaned toward the same assessment ("everything points to it being a Russian missile"), but at the time of initial reporting bomb-disposal experts were still physically examining the object on site — meaning the Kh-101 identification rested on the Ukrainian and Polish political assessment rather than on an independently confirmed forensic finding.

The Polish government cancelled a previously scheduled visit by Prime Minister Donald Tusk, and Defence Minister Władysław Kosiniak-Kamysz described an "extremely difficult night" for Poland's air defences. Tusk subsequently travelled to the crash site himself and confirmed that everything indicated a Russian Kh-101 missile. He stressed, however, that "there are no grounds to believe that Poland was the intended target," while warning that "Russia will do everything possible to avoid responsibility." Tusk also said the United States had expressed interest in taking part in the investigation into the airspace violation.

NATO, through a SHAPE spokesperson, said it was in close contact with Polish authorities. Poland and NATO activated their air and ground defence systems: two Polish F-16s were scrambled, alongside a NATO-owned air-to-air refuelling aircraft, a Polish Saab 340 AEW&C aircraft, and a Polish Mi-24 helicopter. NATO's Supreme Allied Commander Europe, General Alexus Grynkewich, spoke by phone with Poland's Chief of the General Staff, Wiesław Kukuła, about the joint response. The incident fits a broader pattern of repeated violations of NATO's eastern airspace during Russia's mass strikes on Ukraine — comparable to earlier Romanian interceptions of stray Russian drones — and underscores the risk of Russian weaponry, whether intentionally or not, striking NATO territory.`,
  significance: 3,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T06:42:00.000Z',
});

newEntries.push({
  id: 'e-20260730-03',
  stream: 'verified',
  origin: null,
  category: 'ttp',
  topics: ['ew', 'drones'],
  title: "Ukraine destroys Russia's 5,000-km Murmansk-BN electronic-warfare station in Crimea",
  titleNl: "Oekraïne vernietigt Ruslands Murmansk-BN elektronische-oorlogvoeringsstation met bereik van 5.000 km op de Krim",
  sourceRefs: [
    { itemId: 'euromaidan-murmansk-bn', title: 'Russia parked a 5,000-kilometer jamming station in Crimea—Ukraine parked a drone on top of it', url: 'https://euromaidanpress.com/2026/07/30/russia-parked-a-5000-kilometer-jamming-station-in-crimea-ukraine-parked-a-drone-on-top-of-it', source: 'euromaidan', date: '2026-07-30T08:50:13.000Z' },
    { itemId: 'pravda-en-murmansk-bn', title: 'Ukraine hits Russian electronic warfare system in Crimea with range of up to 5,000 km – video', url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046510', source: 'pravda-en', date: '2026-07-30T07:53:00.000Z' },
  ],
  nlSummary: `In de nacht van 26 op 27 juli 2026 hebben drones van de Oekraïense militaire inlichtingendienst (HUR/GUR), ingezet door de Afdeling Onbemande Systemen, een Russisch Moermansk-BN-station voor elektronische oorlogvoering getroffen nabij Kaap Fiolent in het bezette Krim. Het systeem, geproduceerd door het Russische concern KRET en sinds 2014 in dienst, werd voor het eerst juist op de Krim ten zuiden van Sevastopol gestationeerd. Moermansk-BN is een kustgebonden complex bedoeld voor radioverkenning, signaalonderschepping en het storen van kortegolfcommunicatie, met een gemeld bereik tot 5.000 kilometer — genoeg om militaire netwerken tot ver buiten het slagveld te verstoren.

Het exacte dronetype dat bij de aanval werd gebruikt, is in de berichtgeving niet gespecificeerd. Volgens Oekraïense bronnen was dit al de tweede hoogwaardige Russische installatie die dezelfde HUR-eenheid binnen enkele dagen uitschakelde, na eerder een S-400 Triumf-lanceerinstallatie te hebben geraakt. Oekraïense dronetroepen zouden in de eerste helft van 2026 ongeveer 200 Russische luchtverdedigingsmiddelen hebben getroffen, waaronder 76 radars en 31 EW-systemen.

Operationeel gezien ondermijnt de aanval Ruslands vermogen om communicatie over lange afstand rond de Zwarte Zee te monitoren en te verstoren, en legt hij een gat in de EW-dekking van het schiereiland. Opvallend detail: een systeem dat ontworpen is om vijandelijke communicatie op duizenden kilometers afstand te storen, slaagde er niet in de naderende drone tijdig te detecteren.`,
  enSummary: `On the night of 26–27 July 2026, drones operated by Ukraine's Defense Intelligence (HUR/GUR) Department of Unmanned Systems struck a Russian Murmansk-BN electronic-warfare station near Cape Fiolent in occupied Crimea. The system, built by Russian defense concern KRET and in service since 2014, was first fielded in Crimea south of Sevastopol. Murmansk-BN is a coastal complex designed for radio reconnaissance, signal interception, and jamming of shortwave communications, with a reported range of up to 5,000 kilometers — enough to disrupt military networks far beyond the immediate battlefield.

The specific drone model used in the strike was not identified in reporting. Ukrainian sources note this was the second high-value Russian system destroyed by the same HUR unit within days, following an earlier strike on an S-400 Triumf launcher. Ukrainian drone forces are reported to have hit roughly 200 Russian air-defense assets in the first half of 2026, including 76 radars and 31 electronic-warfare systems.

Operationally, the strike degrades Russia's ability to monitor and disrupt long-range communications across the Black Sea region and opens a gap in the peninsula's EW coverage. A notable irony: a system built to jam and silence enemy communications thousands of kilometers away failed to detect the drone closing in on it.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T07:53:00.000Z',
});

newEntries.push({
  id: 'e-20260730-04',
  stream: 'verified',
  origin: null,
  category: 'ttp',
  topics: ['naval-drones', 'navy', 'drones'],
  title: "Ukraine torches Russian naval-drone base at Snizhne near occupied Yevpatoriia",
  titleNl: "Oekraïne verwoest Russische zeedrone-basis bij Snizjne nabij bezet Jevpatoria",
  sourceRefs: [
    { itemId: 'euromaidan-crimea-navaldrone-base', title: 'Russia builds sea drones to hunt Ukraine—Ukraine just torched the base where they sit in occupied Crimea', url: 'https://euromaidanpress.com/2026/07/30/russia-builds-sea-drones-to-hunt-ukraine-ukraine-just-torched-the-base-where-they-sit-in-occupied-crimea', source: 'euromaidan', date: '2026-07-30T10:10:16.000Z' },
  ],
  nlSummary: `Rusland stationeert in bezet Krim een vloot onbemande zeedrones die specifiek zijn bedoeld om Oekraïense maritieme doelen te jagen, waaronder Oekraïne's eigen zeedrones die de Zwarte Zee-vloot en aanvoerroutes naar het schiereiland onder druk zetten. Deze Russische vaartuigen lagen gestationeerd in hangars bij Snizjne, dicht bij Jevpatoria aan de westkust van de Krim.

Oekraïense drone-eenheden — het 9de bataljon 'Kairos' van de 414de afzonderlijke brigade 'Madyar's Birds' onder de Unmanned Systems Forces (SBS) — voerden een aanval uit op de hangars waarin de zeedrones stonden opgeslagen. Warmtebeeldopnames van de aanvallende drones tonen een grote explosie op het moment van inslag, wat wijst op aanzienlijke schade aan de infrastructuur en mogelijk aan de daar aanwezige vaartuigen zelf.

De aanval maakte deel uit van een bredere golf gelijktijdige strikes, waaronder radarschuilplaatsen bij Okhotnytsje nabij Jalta, een Buk-M3-luchtafweersysteem in Donetsk Oblast en radarinstallaties in Rostov en Zaporizja Oblast. De actie past in Operatie MoLoChKa ('Moskou zal via de Krim vallen'), die sinds 6 juli al 205 vaartuigen heeft geraakt en erop gericht is de Krim als militair steunpunt onhoudbaar te maken door aanvoerlijnen, luchtafweer en energie-infrastructuur systematisch te ontmantelen — zonder een grondinvasie.`,
  enSummary: `Russia bases a fleet of uncrewed naval boats in occupied Crimea specifically to hunt Ukrainian maritime targets, including Ukraine's own sea drones that have been squeezing the Black Sea Fleet and supply routes to the peninsula. These Russian vessels were kept in hangars near Snizhne, close to Yevpatoriia on Crimea's western coast.

Ukrainian drone units — the 9th battalion 'Kairos' of the 414th Separate Brigade 'Madyar's Birds' under the Unmanned Systems Forces (SBS) — struck the hangars housing the sea drones. Thermal footage from the attacking drones shows a large blast on impact, indicating significant damage to the facility's infrastructure and likely to the vessels stored inside.

The strike was part of a wider simultaneous operation that also hit radar shelters at Okhotnyche near Yalta, a Buk-M3 air-defense system in Donetsk Oblast, and radar installations across Rostov and Zaporizhzhia Oblasts. The action fits within Operation MoLoChKa ('Moscow will fall through Crimea'), which has struck 205 vessels since July 6 and aims to make Crimea untenable as a Russian military foothold by systematically dismantling supply lines, air defenses, and power infrastructure — without a ground invasion.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T10:10:16.000Z',
});

newEntries.push({
  id: 'e-20260730-05',
  stream: 'verified',
  origin: null,
  category: 'weapon',
  topics: ['naval-drones', 'navy'],
  title: "Russia To Build Uncrewed Vessel For Submarine Detection And Expand Naval Drone Units",
  titleNl: "Rusland kondigt onbemand vaartuig voor onderzeebootdetectie aan en breidt maritieme-droneeenheden uit",
  sourceRefs: [
    { itemId: 'militarnyi-uncrewed-asw-vessel', title: 'Russia To Build Uncrewed Vessel For Submarine Detection And Expand Naval Drone Units', url: 'https://militarnyi.com/en/news/russia-to-build-uncrewed-vessel-for-submarine-detection-and-expand-naval-drone-units/', source: 'militarnyi', date: '2026-07-26T16:48:30.000Z' },
  ],
  nlSummary: `Ruslands marine bouwt naar eigen zeggen een onbemand oppervlaktevaartuig van circa 500 ton, specifiek bedoeld voor het opsporen van onderzeeboten en andere onderwaterobjecten. Het vaartuig is naar verluidt reeds in aanbouw, wordt ontwikkeld binnen het staatsbewapeningsprogramma en moet — als eerste in zijn soort — de basis vormen voor verdere ontwikkeling van onbemande maritieme systemen. Over de sensoren of de exacte detectiemethode zijn in de berichtgeving geen details vrijgegeven.

Daarnaast kondigde de marine een uitbreiding van haar onbemande-systemeneenheden aan. De Noordelijke Vloot heeft al een eerste 'onbemande-systemenregiment' gevormd, bestaande uit twee divisies onbemande oppervlaktevaartuigen en één divisie onbemande onderwatersystemen. Een tweede, vergelijkbaar regiment zou in 2027 bij de Stille Oceaanvloot moeten worden opgericht — een tijdlijn die nog niet onafhankelijk is bevestigd.

De aankondiging kwam van opperbevelhebber admiraal Aleksandr Moisejev, tijdens het Russische staatstelevisieprogramma 'Vojennaja Prijomka'; het bericht werd vervolgens opgepikt door het Russische staatspersbureau TASS en van daaruit door westerse media als Militarnyi doorverteld — de kern van het verhaal steunt dus op een ongeverifieerde eigen verklaring van Russische zijde, zonder onafhankelijke bevestiging van specificaties of tijdlijn. De stap past in een bredere Russische reactie op de Oekraïense maritieme-dronecampagne, die de Zwarte Zeevloot zware verliezen heeft toegebracht en een groot deel van de vloot heeft gedwongen Sevastopol te verlaten.`,
  enSummary: `Russia's navy says it is building an approximately 500-ton uncrewed surface vessel specifically designed to detect submarines and other underwater objects. The vessel is reportedly already under construction, is being developed under the state armament program, and — as the first of its kind — is meant to serve as the foundation for further development of unmanned naval systems. No details on its sensors or exact detection method have been disclosed in the reporting.

The navy also announced an expansion of its unmanned-systems units. The Northern Fleet has already formed a first 'unmanned systems regiment,' consisting of two divisions of uncrewed surface vessels and one division of uncrewed underwater systems. A second, similar regiment is reportedly planned for the Pacific Fleet in 2027 — a timeline that has not been independently confirmed.

The announcement was made by Commander-in-Chief Admiral Aleksandr Moiseyev during the Russian state television program 'Voennaya Priyemka'; the statement was subsequently picked up by Russian state news agency TASS and from there relayed by Western outlets such as Militarnyi — meaning the core of the story rests on an unverified statement from the Russian side, without independent confirmation of specifications or timeline. The move fits into a broader Russian response to Ukraine's maritime drone campaign, which has inflicted heavy losses on the Black Sea Fleet and forced much of it to relocate away from Sevastopol.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: false,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-26T16:48:30.000Z',
});

newEntries.push({
  id: 'e-20260730-06',
  stream: 'verified',
  origin: null,
  category: 'org',
  topics: ['armor', 'artillery', 'air-defense', 'ew', 'logistics'],
  title: "Moscow Military District receives over 50 new, upgraded weapons this year",
  titleNl: "Moskouse Militaire District ontvangt dit jaar meer dan 50 nieuwe en gemoderniseerde wapensystemen",
  sourceRefs: [
    { itemId: 'tass-2167319', title: 'Moscow Military District receives over 50 new, upgraded weapons this year', url: 'https://tass.com/defense/2167319', source: 'tass', date: '2026-07-30T13:36:31.000Z' },
  ],
  nlSummary: `Volgens de Russische staatspersagentschap TASS heeft het Moskouse Militaire District sinds begin 2026 meer dan 50 nieuwe of gemoderniseerde wapensystemen ontvangen. Specifiek genoemd worden Giatsint-K 152mm-kanonnen, T-80BVM-tanks en BMP-2-gevechtsvoertuigen uitgerust met de Berezhok-wapenmodule, PMP-M-pontonbrugsystemen, plus ongespecificeerde luchtverdedigingssystemen, elektronische-oorlogvoeringsmiddelen, genie- en verbindingsapparatuur en modernere gepantserde en gewone voertuigen. Het artikel geeft geen aantallen per type, alleen het totaal van "meer dan 50" systemen.

De apparatuur is verdeeld over "troepen, formaties en eenheden" van het district; specifieke eenheidsaanduidingen of personeelscijfers worden niet gegeven. Volgens TASS heeft het militair personeel het materieel na ontvangst getest en geoefend op oefenterreinen, en heeft het district simulatoren beschikbaar gesteld zodat bemanningen noodscenario's kunnen oefenen zonder de levensduur van het echte materieel te belasten.

Het bericht past in de bredere heropbouw van het Moskouse Militaire District, dat in 2023-2024 werd heropgericht uit het voormalige Westelijke Militaire District, als onderdeel van de Russische herstructurering van de strijdkrachten na de volledige invasie van Oekraïne en de NAVO-uitbreiding met Finland en Zweden. Dergelijke periodieke zelfrapportages over heruitrusting zijn gebruikelijk in Russische staatsmedia. Let op: deze gegevens komen van TASS, Russische staatsmedia, en zijn niet onafhankelijk geverifieerd.`,
  enSummary: `According to Russian state news agency TASS, the Moscow Military District has received more than 50 new or upgraded weapons systems since the start of 2026. Specifically named are Giatsint-K 152mm artillery guns, T-80BVM tanks, and BMP-2 infantry fighting vehicles fitted with the Berezhok combat module, PMP-M pontoon bridge systems, plus unspecified air defense systems, electronic warfare equipment, engineering and communications gear, and modernized armored and general-purpose vehicles. The article gives no per-type quantities, only the overall total of "over 50" systems.

The equipment was distributed across the district's "forces, formations and units," though no specific unit designations or personnel numbers are provided. TASS reports that after receiving the equipment, military personnel tested it and began practicing at training grounds, and that the district has also supplied simulators so crews can rehearse emergency scenarios without wearing down the actual equipment's service life.

The report fits within the broader rebuilding of the Moscow Military District, which was reconstituted in 2023-2024 out of the former Western Military District, as part of Russia's restructuring of its armed forces following the full-scale invasion of Ukraine and NATO's enlargement to include Finland and Sweden. Such periodic self-reported rearmament updates are routine in Russian state media. Note: this information comes from TASS, Russian state media, and has not been independently verified.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: false,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T13:36:31.000Z',
});

newEntries.push({
  id: 'e-20260730-07',
  stream: 'verified',
  origin: null,
  category: 'ttp',
  topics: ['airforce', 'drones'],
  title: "Ukraine's Air Force reports F-16 crash during combat mission, pilot ejects safely",
  titleNl: "Oekraïense luchtmacht meldt crash van F-16 tijdens gevechtsmissie, piloot ejecteert veilig",
  sourceRefs: [
    { itemId: 'pravda-en-f16crash', title: "Ukraine's Air Force reports F-16 crash during combat mission, pilot ejects", url: 'https://www.pravda.com.ua/eng/news/2026/07/29/8046457', source: 'pravda-en', date: '2026-07-29T18:47:00.000Z' },
    { itemId: 'tass-f16crash', title: 'F-16 fighter jet crashes in Ukraine', url: 'https://tass.com/emergencies/2166987', source: 'tass', date: '2026-07-29T19:19:34.000Z' },
    { itemId: 'defensenews-f16wornout', title: "Ukraine's F-16s are being worn out from intercepting Russian drones", url: 'https://www.defensenews.com/flashpoints/ukraine/2026/07/30/ukraines-f-16s-are-being-worn-out-from-intercepting-russian-drones', source: 'defensenews', date: '2026-07-30T11:00:00.000Z' },
  ],
  nlSummary: `Op 29 juli 2026 verloor de Oekraïense luchtmacht het contact met een F-16-gevechtsvliegtuig tijdens een gevechtsmissie aan een deel van het front, waarbij het toestel vijandelijke luchtdoelen onderschepte. Volgens de luchtmacht deed zich aan boord een noodsituatie voor, waardoor de piloot moest ejecteren. De piloot ejecteerde veilig en werd afgevoerd naar een medische instelling voor onderzoek; functionarissen melden dat zijn leven niet in gevaar is. De exacte locatie is niet bekendgemaakt.

De verklaring van de Oekraïense luchtmacht zelf is de primaire bron voor dit incident en wordt bevestigd door het Russische staatsmedium TASS, dat hetzelfde verlies van contact, de ejectie en de ziekenhuisopname rapporteerde. TASS claimde daarnaast dat Oekraïne in 2025 ongeveer 20 gevechtsvliegtuigen heeft verloren, inclusief F-16's — een cijfer afkomstig van Russische staatsmedia dat niet onafhankelijk is bevestigd en dus met voorzichtigheid moet worden behandeld. Dit is minstens het vierde publiek gemelde F-16-verlies voor Oekraïne sinds het toestel in gevechtsdienst kwam, na een dodelijke crash in augustus 2024, een dodelijke crash in april 2025, en een incident in mei 2025 waarbij de piloot veilig ejecteerde.

Het verlies komt te midden van berichten dat de Oekraïense F-16-vloot van circa 39 toestellen (van de ongeveer 79 die door westerse partners zijn toegezegd) wordt uitgeput door vrijwel constante inzet tegen drones. Oekraïense F-16's hebben naar verluidt meer dan 2.500 Russische Geran/Gerbera-eenmalige aanvalsdrones vernietigd, terwijl Rusland meer dan 6.000 van dergelijke drones per maand produceert. RUSI-analist Justin Bronk noemde de resulterende tol op vlieguren van de vliegtuigcasco's en de voorraad lucht-luchtraketten sinds medio 2024 "onhoudbaar", en stelt dat F-16's beter ingezet kunnen worden tegen kruisraketten (zoals de Kh-101) en voor aanvalsmissies, in plaats van vastgehouden te worden aan het onderscheppen van goedkope drones.`,
  enSummary: `On 29 July 2026, Ukraine's Air Force lost contact with an F-16 fighter jet while it was carrying out a combat mission on one section of the front, intercepting enemy air assets. According to the Air Force, an emergency situation developed on board, forcing the pilot to eject. The pilot ejected safely and was evacuated to a medical facility for examination; officials say his life is not in danger. The exact location has not been disclosed.

The Ukrainian Air Force's own statement is the primary source for the incident and is corroborated by Russian state media outlet TASS, which reported the same loss of contact, ejection and hospitalization. TASS additionally claimed that Ukraine has lost roughly 20 fighter aircraft in 2025, including F-16s — a figure that comes from Russian state media and has not been independently verified, so it should be treated with caution. This is at least the fourth publicly reported F-16 loss for Ukraine since the type entered combat service, following a fatal crash in August 2024, a fatal crash in April 2025, and a May 2025 incident in which the pilot ejected safely.

The loss comes amid reporting that Ukraine's roughly 39-strong F-16 fleet (out of about 79 jets pledged by Western partners) is being worn down by near-constant counter-drone duty. Ukrainian F-16s have reportedly destroyed over 2,500 Russian Geran/Gerbera one-way attack drones, while Russia is producing more than 6,000 such drones per month. RUSI analyst Justin Bronk described the resulting toll on airframe flying hours and air-to-air missile stocks since mid-2024 as "unsustainable," arguing F-16s would be better used against cruise missiles (e.g. Kh-101) and in strike missions, rather than being tied down intercepting cheap drones.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-29T18:47:00.000Z',
});

newEntries.push({
  id: 'e-20260730-08',
  stream: 'verified',
  origin: null,
  category: 'org',
  topics: ['air-defense', 'drones', 'logistics'],
  title: "FT: US and France gave Ukraine intelligence to bypass Russian air defenses in strikes on oil refineries",
  titleNl: "FT: VS en Frankrijk gaven Oekraïne inlichtingen om Russische luchtafweer te omzeilen bij aanvallen op olieraffinaderijen",
  sourceRefs: [
    { itemId: 'meduza-en-ft-refinery-intel', title: 'FT: US and France gave Ukraine intelligence to bypass Russian air defenses in strikes on oil refineries', url: 'https://meduza.io/en/news/2026/07/30/ft-us-and-france-gave-ukraine-intelligence-to-bypass-russian-air-defenses-in-strikes-on-oil-refineries', source: 'meduza-en', date: '2026-07-30T08:38:32.000Z' },
  ],
  nlSummary: `Volgens de Financial Times, geciteerd door Meduza op basis van naamloze Oekraïense functionarissen, militaire planners, drone-operators en energiespecialisten, hebben de Verenigde Staten en Frankrijk Oekraïne inlichtingen verstrekt die het mogelijk maken Russische luchtafweer te omzeilen bij aanvallen op olieraffinaderijen. Het gaat om drie soorten informatie: kaarten van Russische luchtafweerposities, routes voor langeafstandsdrones om die posities te ontwijken, en verfijnde doelselectie zodat commandanten precies weten welke kritieke installatie-onderdelen ze moeten raken. Specifieke raffinaderijen worden niet met naam genoemd, maar de FT beschrijft aanvallen op faciliteiten die ver van het front liggen, mede onderbouwd met satellietbeelden.

De strategie is volgens de bronnen verschoven: waar aanvallen eerder vooral gericht waren op branden of het vernietigen van opslagtanks, is het doel nu om installaties zo lang mogelijk offline te houden — onder meer door herhaaldelijk dezelfde reeds beschadigde onderdelen te raken voordat reparaties zijn afgerond. Volgens gerelateerde berichtgeving telde Oekraïne sinds begin 2026 al 194 aanvallen op Russische raffinaderijen, elf keer zoveel als in dezelfde periode vorig jaar, met een maandrecord van 16 aanvallen in mei. Dit draagt bij aan wat wordt omschreven als Ruslands ergste brandstofcrisis in decennia, met brandstofrantsoenering in meer dan de helft van de Russische regio's.

Noch de Amerikaanse, Franse, Oekraïense of Russische regering heeft dit officieel bevestigd of ontkend; de claims steunen volledig op FT-bronnen en naamloze Oekraïense functionarissen. Het onderstreept wel een bredere, geleidelijk zichtbaarder wordende westerse betrokkenheid bij Oekraïense dieptestrikes tegen Russische energie-infrastructuur, een onderwerp dat geopolitiek gevoelig ligt gezien de directe rol van inlichtingendiensten bij doelselectie op Russisch grondgebied.`,
  enSummary: `According to the Financial Times, cited by Meduza via unnamed Ukrainian officials, military planners, drone operators and energy specialists, the United States and France have provided Ukraine with intelligence enabling it to bypass Russian air defenses during strikes on oil refineries. Three types of support are described: mapping of Russian air defense positions, route planning for long-range drones to evade those positions, and refined target selection so commanders know exactly which critical equipment to hit. No specific refineries are named, but the FT describes strikes on facilities far from the front line, partly corroborated by satellite imagery.

The strategy has reportedly shifted: rather than simply starting fires or destroying storage tanks, the aim is now to keep facilities offline as long as possible — including by repeatedly striking the same already-damaged components before repairs can be completed. Related reporting states Ukraine has carried out 194 strikes on Russian refineries since the start of 2026, eleven times more than the same period last year, with a monthly record of 16 strikes in May. This is contributing to what is described as Russia's worst fuel crisis in decades, with fuel rationing in more than half of Russia's regions.

Neither the US, French, Ukrainian nor Russian government has officially confirmed or denied this; the claims rest entirely on FT sourcing and unnamed Ukrainian officials. The report nonetheless highlights a broader, increasingly visible pattern of Western involvement in Ukraine's deep strikes on Russian energy infrastructure — a geopolitically sensitive topic given the direct role of intelligence services in target selection on Russian territory.`,
  significance: 3,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T08:38:32.000Z',
});

newEntries.push({
  id: 'e-20260730-09',
  stream: 'verified',
  origin: null,
  category: 'weapon',
  topics: ['missiles', 'logistics'],
  title: "62 of the 140 foreign parts in this Russian missile were American. Ukraine wants that gap closed",
  titleNl: "62 van de 140 buitenlandse onderdelen in deze Russische raket waren Amerikaans. Oekraïne wil dat gat gedicht zien",
  sourceRefs: [
    { itemId: 'euromaidan-iskander-parts', title: '62 of the 140 foreign parts in this Russian missile were American. Ukraine wants that gap closed', url: 'https://euromaidanpress.com/2026/07/30/62-of-the-140-foreign-parts-in-this-russian-missile-were-american-ukraine-wants-that-gap-closed', source: 'euromaidan', date: '2026-07-29T22:04:04.000Z' },
  ],
  nlSummary: `Oekraïense analisten onderzochten het wrak van een Iskander-ballistische raket die op 10 juli op de regio Kyiv werd afgevuurd en telden meer dan 140 buitenlandse onderdelen. Van die onderdelen bleken er 62 — ruim 40 procent — van Amerikaanse makelij te zijn, ondanks jarenlange westerse sancties tegen de Russische wapenindustrie.

Naast de Amerikaanse componenten identificeerden onderzoekers acht onderdelen uit Zwitserland, vijf uit Duitsland, vier uit Taiwan, twee uit China en één uit Japan; daarnaast bevatte de raket 36 Russische en 11 Wit-Russische onderdelen. Onder de herkende fabrikanten zijn het Zwitserse STMicroelectronics en Traco Power en het Japanse Panasonic Semiconductor; minstens twintig onderdelen dateren van 2025, wat erop wijst dat de aanvoer doorloopt.

Volgens Oekraïens sanctiebevelhebber Vladyslav Vlasiuk bereiken deze onderdelen Rusland via gewone commerciële kanalen die via tussenpersonen in derde landen worden omgeleid. Hij stelt dat het wegvallen van alleen de West-Europese componenten de productie al onmogelijk zou maken, en dringt er bij westerse partners op aan dit handhavingsgat te dichten door export via doorvoerlanden strenger te controleren.`,
  enSummary: `Ukrainian analysts examined the wreckage of an Iskander ballistic missile fired at Kyiv Oblast on 10 July and counted more than 140 foreign-made components. Of those, 62 — over 40 percent — turned out to be American-made, despite years of Western sanctions targeting Russia's arms industry.

Alongside the American parts, investigators identified eight components from Switzerland, five from Germany, four from Taiwan, two from China and one from Japan; the missile also contained 36 Russian and 11 Belarusian parts. Recognized manufacturers include Switzerland's STMicroelectronics and Traco Power and Japan's Panasonic Semiconductor; at least twenty of the components date from 2025, indicating the supply chain remains active.

Ukrainian sanctions envoy Vladyslav Vlasiuk says these parts reach Russia through ordinary commercial channels rerouted via intermediaries in third countries. He argues that removing just the Western European components alone would make production impossible, and is urging Western partners to close this enforcement gap by tightening controls on exports routed through transit countries.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: true,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-29T22:04:04.000Z',
});

newEntries.push({
  id: 'e-20260730-10',
  stream: 'verified',
  origin: null,
  category: 'ttp',
  topics: ['mobilization'],
  title: "FSB says Ukrainian intelligence recruited Russian teens for sabotage via popular Telegram dating bot",
  titleNl: "FSB beweert dat Oekraïense inlichtingendienst Russische tieners via populaire Telegram-datingbot ronselde voor sabotage",
  sourceRefs: [
    { itemId: 'meduza-en-fsb-dating-bot-sabotage-2026-07-29', title: 'FSB says Ukrainian intelligence is recruiting Russians for sabotage via popular Telegram dating bot', url: 'https://meduza.io/en/news/2026/07/29/fsb-says-ukrainian-intelligence-is-recruiting-russians-for-sabotage-via-popular-telegram-dating-bot', source: 'meduza-en', date: '2026-07-29T10:09:33.000Z' },
  ],
  nlSummary: `De Russische veiligheidsdienst FSB claimt dat Oekraïense inlichtingendiensten de populaire Telegram-datingbot "Daivinchik" gebruikten om Russische burgers — vooral tieners — te ronselen voor sabotagedaden. Volgens de FSB en het Russische Onderzoekscomité deden agenten zich voor als jonge vrouwen om via de bot vriendschap te sluiten met minderjarigen, waarna phishing-links werden verstuurd. Dit is een ONBEVESTIGDE bewering van de Russische inlichtingendienst; onafhankelijke bevestiging ontbreekt.

De FSB stelt dat sinds juli 2025 in totaal 46 gebruikers tussen de 12 en 22 jaar oud zijn opgepakt in 16 Russische regio's. Zij zouden op last van Oekraïense inlichtingendiensten aanvallen op politieagenten en brandstichtingen hebben gepleegd. Er zijn strafzaken geopend. Al in december 2025 blokkeerde de Russische mediatoezichthouder Roskomnadzor de bot, met als officiële reden "kinderpornografie en LHBT-propaganda" — een motivering die los staat van de latere sabotagebeschuldiging.

Meduza plaatst deze claim zonder eigen verificatie of kritische duiding en geeft vrijwel uitsluitend het standpunt van de FSB en het Onderzoekscomité weer. Dit past in een breder, terugkerend patroon van Russische beschuldigingen dat Oekraïense diensten via apps en sociale media (vooral minderjarige) Russen ronselen voor sabotage — beweringen die vaak als binnenlands narratief dienen zonder onafhankelijke rechtbank- of persverslagen die de details bevestigen.`,
  enSummary: `Russia's FSB claims that Ukrainian intelligence services used the popular Telegram dating bot "Daivinchik" to recruit Russian citizens — mostly teenagers — for sabotage acts. According to the FSB and Russia's Investigative Committee, operatives posed as young women to befriend minors through the bot before sending them phishing links. This is an UNCONFIRMED claim by the Russian security service; no independent verification is available.

The FSB states that since July 2025, a total of 46 users aged 12 to 22 have been detained across 16 Russian regions. They allegedly carried out attacks on police officers and arson attacks on orders from Ukrainian intelligence. Criminal cases have been opened. Russian media regulator Roskomnadzor had already blocked the bot back in December 2025, officially citing "child pornography and LGBT propaganda" — a rationale unrelated to the later sabotage accusation.

Meduza relays this claim without independent verification or critical framing, presenting almost exclusively the FSB's and Investigative Committee's account. This fits a broader, recurring pattern of Russian accusations that Ukrainian services recruit (often minor) Russian citizens via apps and social media for sabotage — claims frequently serving a domestic narrative purpose without independent court records or press coverage confirming the details.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: false,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-29T10:09:33.000Z',
});

newEntries.push({
  id: 'e-20260730-s01',
  stream: 'single',
  origin: 'ru',
  category: 'weapon',
  topics: ['drones', 'ew'],
  title: "«Теперь российские FPV-дроны видимы»: комплекс активной защиты SOVA-1.0 для ВСУ",
  titleNl: "\"Nu zijn Russische FPV-drones zichtbaar\": actief beschermingscomplex SOVA-1.0 voor de ZSU",
  sourceRefs: [
    { itemId: 'topwar-sova-1', title: '«Теперь российские FPV-дроны видимы»: комплекс активной защиты SOVA-1.0 для ВСУ', url: 'https://topwar.ru/287177-teper-rossijskie-fpv-drony-vidimy-kompleks-aktivnoj-zaschity-sova-10-dlja-vsu.html', source: 'topwar', date: '2026-07-30T09:39:38.000Z' },
  ],
  nlSummary: `De Russische pro-Kremlin publicatie topwar.ru meldt dat het Oekraïense bedrijf Tactical Technology een geïntegreerd actief beschermingscomplex (KAZ) genaamd SOVA-1.0 heeft ontwikkeld voor gebruik door de Oekraïense strijdkrachten (ZSU), gericht tegen Russische FPV-drones. Het systeem zou vier detectiemethoden combineren: RF-detectie via de FlyOff-software met gerichte antennes (bereik tot 10 km), een AESA-radar genaamd Blood Seeker (bereik tot 1.800 meter), optische waarneming (tot 150 meter) en onderschepping van analoge videosignalen van tegenstanders. Als tegenmaatregel na detectie noemt het artikel meerdere modules: MOROK-4X/1X (radiojamming tot 200 m), ZHNETS-223/12 (automatische vuurwapensturing tot 100 m) en ZOREPAD-6P (mortier-afgevuurde vangnetten tot 50 m).

Het artikel plaatst deze ontwikkeling nadrukkelijk als een bedreiging voor het Russische tactische voordeel met FPV-drones: eerdere Russische innovaties zoals frequentiewisselingen en glasvezelbesturing zouden door SOVA-1.0 (deels) tegenwerkbaar worden. De publicatie citeert een uitspraak van de Tactical Technology-ontwikkelaars dat het systeem "bedreigingen kan detecteren die geen enkel radiosignaal uitzenden". Concrete gegevens over gewicht, kosten, productieaantallen, operationele testresultaten of een introductiedatum ontbreken in het artikel.

LET OP — SINGLE SOURCE: dit bericht is uitsluitend gebaseerd op de Russische pro-Kremlin publicatie topwar.ru. De beweringen over het Oekraïense SOVA-1.0-systeem zijn niet onafhankelijk geverifieerd via Oekraïense, westerse of andere bronnen en moeten met de nodige voorzichtigheid worden behandeld.`,
  enSummary: `Russian pro-Kremlin outlet topwar.ru reports that Ukrainian company Tactical Technology has developed an integrated active protection complex (APS) called SOVA-1.0 for use by Ukraine's armed forces (ZSU) against Russian FPV drones. The system reportedly combines four detection methods: RF detection via the FlyOff software with directional antennas (range up to 10 km), an AESA radar called Blood Seeker (range up to 1,800 meters), optical observation (up to 150 meters), and interception of adversaries' analog video signals. As countermeasures after detection, the article lists several modules: MOROK-4X/1X (radio jamming up to 200 m), ZHNETS-223/12 (automated gun-laying/fire control up to 100 m), and ZOREPAD-6P (mortar-fired capture nets up to 50 m).

The article frames this development explicitly as a threat to Russia's tactical advantage with FPV drones: earlier Russian innovations such as frequency hopping and fiber-optic guidance would reportedly become (partly) counterable by SOVA-1.0. The publication quotes the Tactical Technology developers as saying the system "is capable of detecting threats that emit no radio signal whatsoever." The article provides no concrete data on weight, cost, production numbers, operational test results, or an introduction date.

CAVEAT — SINGLE SOURCE: this item is based solely on the Russian pro-Kremlin publication topwar.ru. The claims about the Ukrainian SOVA-1.0 system have not been independently verified through Ukrainian, Western, or other sources and should be treated with appropriate caution.`,
  significance: 2,
  changeFlag: 'new',
  syndicate: false,
  firstSeen: FIRST_SEEN,
  updatedAt: RUN_TS,
  publishedAt: '2026-07-30T09:39:38.000Z',
});

// ---------- UPDATES TO EXISTING ENTRIES ----------

// U1: Wildberries e-20260719-03
{
  const e = findEntry('e-20260719-03');
  e.nlSummary = `De Oekraïense droneaanvallen op Wildberries, Ruslands grootste online marktplaats, blijven zich sinds het begin van de aanvallen rond 17-18 juli 2026 uitbreiden. Op 30 juli waren sinds half juli minstens 13 Wildberries-logistiekcentra geraakt (tegen 11 op 29 juli), verspreid ver voorbij de oorspronkelijke cluster rond Moskou (Elektrostal), de Tambov-regio (Kotovsk, waar zeven nachtploegmedewerkers omkwamen) en Ryazan (opnieuw geraakt in de nacht van 28 op 29 juli, met zes gehospitaliseerden) naar nieuw getroffen locaties in de Leningrad-oblast, een sorteercentrum in het dorp Mastinovka (Penza-regio, één gewonde), een logistiek centrum in Sarapul (Oedmoertië, brand, geen slachtoffers dankzij evacuatie), en een magazijn op zo'n 1500 km van de grens in Perm Krai — een van de diepste aanvallen tot nu toe, gelijktijdig met een aanval op de olieraffinaderij van Perm. De Oekraïense generale staf stelde dat de aanvallen het "militair-economisch potentieel van de Russische agressor" moeten verminderen en herhaalde de claim dat de locaties dronecomponenten en dual-use goederen opslaan. Naar schatting blijft 10% of meer van Wildberries' landelijke magazijnnetwerk buiten werking.

Het patroon van aansprakelijkheidsontwijking dat Wildberries zelf inzette — en dat Megamarket, Ozon en Yandex Market al met bijna identieke overmacht-clausules hebben overgenomen — is inmiddels uitgegroeid tot een volwaardig juridisch conflict. Wildberries wijzigde op 7 juli stilletjes zijn verkopersovereenkomst om droneaanvallen als overmacht te bestempelen, waarmee het bedrijf zich vrijpleit van compensatie voor goederen die daarna worden vernietigd. Verkopers en juristen stellen dat een contractclausule dit niet eenzijdig kan beslechten: volgens artikel 401 lid 3 van het Russische Burgerlijk Wetboek bepalen alleen rechtbanken of een gebeurtenis werkelijk buitengewoon en onvermijdelijk was, en aansprakelijkheid kan blijven bestaan als nalatigheid van de marktplaats zelf — gebrekkige brandblussystemen, opslagovertredingen — heeft bijgedragen aan het verlies. Forbes Russia schat de totale schade op 150 tot 170 miljard roebel, waarbij verkopers ongeveer vijf keer meer verlies dragen dan Wildberries zelf; velen melden symbolische uitkeringen van slechts 2600 tot 2900 roebel tegenover verliezen van 40.000 tot 130.000 roebel.

De menselijke en regionale schaal blijft groeien: in de Leningrad-oblast alleen al raakten ongeveer 1500 verkopers hun opgeslagen goederen kwijt, waarop gouverneur Aleksandr Drozdenko goedkope leningen en een nieuw coördinatiecentrum beloofde. Ondertussen zou Wildberries' eigenaar RWB Group nog steeds op zoek zijn naar magazijncapaciteit in Kazachstan (ongeveer 100.000 m²) als afdekking tegen verdere aanvallen, ook al presenteert het bedrijf dit officieel als vooraf geplande uitbreiding. Met duizenden extra gedupeerde verkopers in de Leningrad-oblast, Penza, Oedmoertië en Perm — bovenop het oorspronkelijke aanvalsgebied — en zonder dat er nog een overheidscompensatieregeling is ingevoerd, blijft de economische en juridische impact van de campagne tegen de Russische e-commerce-logistiek escaleren.`;
  e.enSummary = `Ukraine's drone campaign against Wildberries, Russia's largest online marketplace, has continued to widen since the strikes began around July 17-18, 2026. By July 30, at least 13 Wildberries logistics facilities had been hit since mid-July (up from 11 on July 29), spreading well beyond the original cluster around Moscow (Elektrostal), Tambov region (Kotovsk, where seven night-shift workers died) and Ryazan (hit again overnight July 28-29, with six hospitalized) to newly struck sites in Leningrad region, a sorting hub in Mastinovka village, Penza region (one injured), a logistics center in Sarapul, Udmurt Republic (fire, no casualties after evacuation), and a warehouse roughly 1,500 km from the border in Perm Krai — among the deepest strikes of the campaign, coinciding with an attack on the Perm oil refinery. Ukraine's General Staff said the strikes aim to "reduce the military-economic potential of the Russian aggressor" and again claimed the sites store drone components and dual-use goods. An estimated 10% or more of Wildberries' national warehouse network remains disabled.

The liability-evasion pattern first set by Wildberries — and already copied by Megamarket, Ozon and Yandex Market via near-identical force majeure clauses — has now become a full-blown legal dispute. Wildberries quietly amended its seller agreement on July 7 to classify drone strikes as force majeure, exempting itself from compensating sellers for goods destroyed afterward. Sellers and lawyers argue a contract clause alone cannot settle the matter: under Article 401(3) of Russia's Civil Code, only courts can determine whether an event was truly extraordinary and unavoidable, and liability can persist where the marketplace's own negligence — inadequate fire-suppression systems, storage violations — contributed to losses. Forbes Russia estimates total damage at 150-170 billion rubles, with sellers absorbing roughly five times more of the loss than Wildberries itself; many report token payouts of just 2,600-2,900 rubles against losses of 40,000-130,000 rubles.

The human and regional scale keeps growing: in Leningrad region alone, roughly 1,500 sellers lost their stored goods, prompting governor Alexander Drozdenko to promise preferential loans and a new coordination headquarters. Meanwhile Wildberries' owner, RWB Group, is still reportedly scouting warehouse capacity in Kazakhstan (around 100,000 sqm) as a hedge against further strikes, even as the company officially frames the move as pre-planned expansion. With thousands of additional sellers now affected across Leningrad, Penza, Udmurtia and Perm regions on top of the original strike zone, and no government compensation scheme yet in place, the economic and legal fallout from the campaign against Russia's e-commerce logistics backbone continues to escalate.`;
  e.sourceRefs.push(
    { itemId: 'meduza-wildberries-force-majeure', title: "Wildberries says Ukraine's drone strikes are force majeure. Does that actually get the marketplace off the hook in Russia?", url: 'https://meduza.io/en/feature/2026/07/30/wildberries-says-ukraine-s-drone-strikes-are-force-majeure-does-that-actually-get-the-marketplace-off-the-hook-in-russia', source: 'meduza-en', date: '2026-07-29T23:08:02.000Z' },
    { itemId: 'meduza-leningrad-1500-sellers', title: "About 1,500 sellers in Russia's Leningrad Region lost their goods after attacks on a Wildberries warehouse. The governor promised them support.", url: 'https://meduza.io/en/news/2026/07/30/about-1-500-sellers-in-russia-s-leningrad-region-lost-their-goods-after-attacks-on-a-wildberries-warehouse-the-governor-promised-them-support', source: 'meduza-en', date: '2026-07-30T09:28:48.000Z' },
    { itemId: 'kyivindep-penza-udmurtia-blazes', title: "'The package won't arrive:' Blazes at Wildberries warehouses in Russia's Penza, Udmurtia amid more Ukrainian drone strikes", url: 'https://kyivindependent.com/the-package-wont-arrive-blazes-at-wildberries-warehouses-in-russias-penza-udmurtia-amid-more-ukrainian-drone-strikes/', source: 'kyivindep', date: '2026-07-30T09:01:56.000Z' },
    { itemId: 'meduza-two-more-warehouses-burn', title: 'Two more Wildberries warehouses burn in Russian regions after Ukrainian drone attacks', url: 'https://meduza.io/en/news/2026/07/30/two-more-wildberries-warehouses-burn-in-russian-regions-after-ukrainian-drone-attacks', source: 'meduza-en', date: '2026-07-30T07:35:32.000Z' },
    { itemId: 'pravda-perm-udmurtia-drones', title: "Drones strike Wildberries warehouses in Russia's Perm Krai and Udmurtia – photos, videos", url: 'https://www.pravda.com.ua/eng/news/2026/07/30/8046531', source: 'pravda-en', date: '2026-07-30T11:09:00.000Z' },
  );
  e.changeFlag = 'update';
  e.updatedAt = RUN_TS;
}

// U3: Banderol e-20260729-02
{
  const e = findEntry('e-20260729-02');
  e.nlSummary = `Rusland heeft een grondgebaseerde lanceerinrichting ingevoerd voor de S8000 Banderol, een compacte, straalgedreven kruis-/glijraket die het al inzet bij gecombineerde aanvallen op Kyiv, en maakt daarmee een einde aan de afhankelijkheid van de schaarse Orion-verkennings-/aanvalsdrone — tot dusver het enige bevestigde lanceerplatform, dat slechts één Banderol tegelijk kan meevoeren. Foto's die online circuleren — volgens berichten voor het eerst getoond aan Vladimir Poetin tijdens een gesloten wapenbeurs in 2025 — tonen de nieuwe lanceerinrichting als een compact systeem, vermoedelijk gemonteerd op een pick-up-achtig voertuig en waarschijnlijk voorzien van vastebrandstofboosters. Gerapporteerde specificaties omvatten een 8,5 kg wegende Chinese Swiwin-turbojetmotor, een topsnelheid van 620-650 km/u, een opgegeven maximaal bereik tot 500 km en een OFBCh-150-kop van 114,3 kg met circa 49,5 kg HMX-explosief.

De Oekraïense militaire inlichtingendienst (DIU) heeft inmiddels bevestigd dat de Banderol de testfase heeft verlaten en in massaproductie is gegaan (Militarnyi, 30 juli 2026). Een DIU-vertegenwoordiger zei dat de modellen van 2026 substantieel verschillen van de varianten uit 2025, wat wijst op voortdurende modernisering na indienststelling, en dat onderdelen van de Banderol een aanzienlijk deel uitmaakten van het wapenpuin dat werd aangetroffen na aanvallen op Odesa, waar Rusland de raket vooral inzet tegen statische civiele infrastructuur. Volgens de DIU-functionaris zijn FPV-onderscheppingsdrones niet effectief tegen deze raket. Naast de Orion-drone en de grondlanceerder bevestigt de DIU nu ook specifiek grondlanceringen vanuit bezet Krim, plus een derde platform: de Mi-28-gevechtshelikopter. Het artikel noemt geen fabriek, productielocatie of productiecijfers/-tempo.

Samen onderbouwen de bevestigde massaproductie en de toename van lanceerplatforms de zorgen die Oekraïense analisten al uitten toen de grondlanceerder voor het eerst opdook: het verlies van de vroegtijdige waarschuwing die Oekraïne voorheen kreeg door opstijgende Orions te observeren, en een verschuiving naar gelijktijdige, salvo-achtige lanceringen nu grondlanceerders — in tegenstelling tot de schaarse Orion-drones — in aantal kunnen worden geproduceerd. Analyse van teruggevonden raketten wijst ook op voortdurende afhankelijkheid van buitenlandse elektronica uit de VS, Zwitserland, Japan, China en Zuid-Korea, wat suggereert dat Rusland ondanks sancties alternatieve toeleveringskanalen aanhoudt.`;
  e.enSummary = `Russia has fielded a ground-based launcher for its S8000 Banderol, a compact jet-powered cruise/glide missile it already uses in combined strikes on Kyiv, ending its former reliance on the scarce Orion strike/reconnaissance drone — previously the missile's only confirmed launch platform, able to carry just one Banderol at a time. Photos circulating online, reportedly first shown to Vladimir Putin at a closed 2025 arms exhibition, show the new launcher as a compact system likely mounted on a pickup-type vehicle, probably fitted with solid-fuel boosters. Reported specifications describe an 8.5 kg Chinese-made Swiwin turbojet engine, a top speed of 620-650 km/h, a stated maximum range of up to 500 km, and a 114.3 kg OFBCh-150 warhead containing about 49.5 kg of HMX-based explosive.

Ukraine's Defence Intelligence (DIU) has now confirmed that Banderol production has moved from testing into mass production (per Militarnyi, 30 July 2026). A DIU representative said the 2026-model missiles differ substantially from the 2025 variants, indicating continued modernization even after fielding, and that Banderol components made up a significant share of the weapon debris recovered after strikes on Odesa, where Russia has primarily used the missile against stationary civilian infrastructure. The DIU official added that FPV interceptor drones are ineffective against the missile. Beyond the Orion drone and the ground launcher, DIU now also confirms ground-based launches from occupied Crimea specifically, plus a third platform: Mi-28 attack helicopters. The article gives no factory, production location, or output/rate figures.

Taken together, confirmed mass production and a proliferation of launch platforms substantiate the concerns Ukrainian analysts raised when the ground launcher first surfaced: loss of the early warning Ukraine previously got from observing Orion takeoffs, and a shift toward simultaneous, salvo-style launches now that ground launchers — unlike scarce Orion drones — can be mass-produced. Analysis of recovered missiles also points to continued reliance on foreign electronics from the US, Switzerland, Japan, China and South Korea, suggesting Russia maintains alternative supply channels despite sanctions.`;
  e.significance = 3;
  e.sourceRefs.push(
    { itemId: '3148dfd19c7e', title: 'Russia Begins Mass Production of New Banderol Cruise Missile Following Strikes on Ukraine', url: 'https://militarnyi.com/en/news/russia-production-banderol-cruise-missile/', source: 'militarnyi', date: '2026-07-29T18:49:26.000Z' },
  );
  e.changeFlag = 'update';
  e.updatedAt = RUN_TS;
}

// U4: command reshuffle e-20260729-06
{
  const e = findEntry('e-20260729-06');
  e.title = "Ukraine's command shake-up widens: Fedorov cites 'ideological conflict' with Syrskyi, delayed mobilisation reform, new deputy ministers, NATO awaits Drapatyi meeting";
  e.titleNl = "Oekraïense commandowissel breidt uit: Fedorov spreekt van 'ideologisch conflict' met Syrsky, vertraagde mobilisatiehervorming, nieuwe plaatsvervangend ministers, NAVO wacht op ontmoeting met Drapatyi";
  e.nlSummary = `De Oekraïense generale staf voert onder de nieuw aangestelde opperbevelhebber Mykhailo Drapatyi een leger-breed onderzoek uit naar de verdeling van personeel over brigades, regimenten en legerkorpsen, met als doel scheve bemanning tussen front- en achterwaartse eenheden bloot te leggen en te verhelpen. Het is een van Drapatyi's eerste concrete stappen sinds hij eind juli 2026 het opperbevel overnam van Oleksandr Syrsky, die door Zelensky werd ontslagen.

Die commandowissel blijkt onlosmakelijk verbonden met een bredere bestuurlijke schoonmaak. Ex-defensieminister Mykhailo Fedorov, die kort na Syrsky's ontslag zelf werd vervangen door waarnemend minister Yevhen Khmara, verklaarde in een interview met Ukrainska Pravda dat zijn conflict met Syrsky geen persoonlijke kwestie was maar een "ideologisch conflict" over de te volgen oorlogsvisie — een institutioneel en cultureel meningsverschil over besluitvormingstempo en vertrouwen in jonge leidinggevenden, niet een strijd om zijn eigen positie: hij benadrukte geen ultimatums te hebben gesteld en dat het ministerie nooit een besluit van de generale staf of Syrsky heeft geblokkeerd. Fedorov onthulde ook dat een leger-brede mobilisatiehervorming — bedoeld om de personeelscrisis aan te pakken via nieuwe dienstvoorwaarden, contracten met vaste duur, hogere soldij en de werving van buitenlandse militairen — in juli gepresenteerd en in augustus gelanceerd had moeten worden, met als doel het personeelstekort tegen september grotendeels op te lossen; hij hoopt dat Drapatyi en het ministerie deze plannen voortzetten.

Parallel daaraan herstructureert het kabinet de ministeriële top: Liubov Halan wordt plaatsvervangend defensieminister, verantwoordelijk voor werving, loopbaanontwikkeling en sociale bescherming van militairen, terwijl Serhii Boiev plaatsvervangend minister voor Europese integratie wordt en zich richt op samenwerking met EU/NAVO, wapenleveranties en internationale financiering. Op het NAVO-front meldt de Alliantie dat het "slechts een kwestie van tijd" is voordat Drapatyi persoonlijk de geallieerde opperbevelhebber in Europa, generaal Alexus Grynkewich (SACEUR), ontmoet — die al telefonisch contact had met Drapatyi vlak na diens aantreden.`;
  e.enSummary = `Ukraine's General Staff, under newly appointed Commander-in-Chief Mykhailo Drapatyi, is carrying out a force-wide review of how personnel is distributed across brigades, regiments and corps, aiming to expose and correct staffing imbalances between front-line and rear/support units. It is one of Drapatyi's first substantive actions since he took over as commander-in-chief in late July 2026 from Oleksandr Syrskyi, whom President Zelensky dismissed.

That change of command turns out to be tied to a broader shake-up at the top of Ukraine's defense establishment. Former defense minister Mykhailo Fedorov — himself replaced shortly after Syrskyi's dismissal by acting minister Yevhen Khmara — told Ukrainska Pravda that his falling-out with Syrskyi was not a personal dispute but an "ideological conflict" over how the war should be fought: an institutional and cultural disagreement about the pace of decision-making and trust placed in younger leaders, not a fight over his own job. He said he issued no ultimatums and that the ministry never blocked a single General Staff or commander-in-chief decision. Fedorov also disclosed that a force-wide mobilization reform — meant to tackle the staffing crisis through new service terms, fixed-term contracts, higher pay and recruitment of foreign nationals — had been due to be presented in July and launched in August, aiming to largely resolve the manpower shortfall by September; he said he hopes Drapatyi and the ministry will carry the plan forward.

In parallel, the Cabinet is reshuffling the ministry's leadership: Liubov Halan becomes deputy defense minister overseeing recruitment, career development and social protection for service members, while Serhii Boiev becomes deputy minister for European integration, focused on cooperation with the EU and NATO, arms deliveries and international funding. On the NATO front, the Alliance says it is "only a matter of time" before Drapatyi meets face-to-face with Supreme Allied Commander Europe General Alexus Grynkewich (SACEUR), who already held a phone call with Drapatyi shortly after he took command.`;
  e.significance = 3;
  e.sourceRefs.push(
    { itemId: '4c32b61e76d3', title: "Ukraine's former defense minister Fedorov says he had no personal conflict with former armed forces commander-in-chief Syrskyi. 'It's an ideological conflict.'", url: 'https://meduza.io/en/news/2026/07/30/ukraine-s-former-defense-minister-fedorov-says-he-had-no-personal-conflict-with-former-armed-forces-commander-in-chief-syrskyi-it-s-an-ideological-conflict', source: 'meduza-en', date: '2026-07-30T09:40:20.000Z' },
    { itemId: 'fa1b750f3ec5', title: "Ex-defence minister Fedorov: Ukraine's mobilisation overhaul was due to launch in August to fix staffing crisis by September", url: 'https://www.pravda.com.ua/eng/news/2026/07/29/8046465', source: 'pravda-en', date: '2026-07-29T19:50:00.000Z' },
    { itemId: '7fcb5261023f', title: "Former defence minister Fedorov says dispute with Ukraine's ex military chief Syrskyi was a clash of visions, not a personal feud", url: 'https://www.pravda.com.ua/eng/news/2026/07/29/8046464', source: 'pravda-en', date: '2026-07-29T19:43:00.000Z' },
    { itemId: '5369d07a5f5d', title: 'Ukrainian government appoints new deputy defence ministers', url: 'https://www.pravda.com.ua/eng/news/2026/07/29/8046449', source: 'pravda-en', date: '2026-07-29T18:11:00.000Z' },
    { itemId: '252042929a96', title: "NATO says it's 'only a matter of time' before Ukraine's new commander-in-chief and top Allied commander in Europe meet in person", url: 'https://www.pravda.com.ua/eng/news/2026/07/29/8046433', source: 'pravda-en', date: '2026-07-29T15:48:00.000Z' },
  );
  e.changeFlag = 'update';
  e.updatedAt = RUN_TS;
}

data.entries.push(...newEntries);
data.updated = RUN_TS;

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('Done. Total entries now:', data.entries.length);
console.log('New entries added:', newEntries.map(e => e.id).join(', '));
