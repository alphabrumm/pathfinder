// LehrplanPLUS Bayern, Gymnasium (G9), Fachlehrpläne – Lernbereiche mit Inhalts-Schlagworten
// Quelle: https://www.lehrplanplus.bayern.de (Fachlehrpläne), Stand der Übernahme: November 2026 (weitere Fächer: 17.11.2026).
// Schlagworte sind Kurzfassungen der „Inhalte zu den Kompetenzen“, keine wörtlichen Zitate.
// Aufbau: LP[Fach][Jahrgangsstufe] = [[Nummer, Titel, [Schlagworte], Gruppe?], …]
// Gruppe (optional) trennt Varianten, z. B. Anforderungsniveau oder Ausbildungsrichtung.

export const SOURCE = 'LehrplanPLUS Bayern, Gymnasium, Fachlehrpläne';
/** Pfad auf lehrplanplus.bayern.de für die neu aufgenommenen Fächer (Standardvariante wie in LP hinterlegt) */
const OB = j => j >= 12 ? '/grundlegend' : '';
const SLUG = {
  Biologie: j => 'biologie' + OB(j),
  Chemie: j => 'chemie' + (j === 9 || j === 10 ? '/ch' : OB(j)),
  'Natur und Technik': () => 'nt_gym',
  Englisch: j => 'englisch' + (j >= 6 && j <= 9 ? '/1-fremdsprache' : OB(j)),
  Französisch: j => 'franzoesisch' + (j === 8 ? '/2fs' : j <= 9 ? '/2-fremdsprache' : j <= 11 ? '/1-2-fremdsprache' : '/grundlegend-1-2-3'),
  Spanisch: j => 'spanisch' + (j >= 12 ? '/grundlegend-3' : j >= 10 ? '/3-fremdsprache' : ''),
  Italienisch: j => 'italienisch' + (j >= 12 ? '/grundlegend-3' : j >= 10 ? '/3-fremdsprache' : ''),
  Russisch: j => 'russisch' + (j >= 12 ? '/grundlegend-3' : j >= 10 ? '/3-fremdsprache' : ''),
  Griechisch: j => 'griechisch' + OB(j),
  Geographie: j => 'geographie' + OB(j),
  'Wirtschaft und Recht': j => 'wirtschaft-und-recht' + (j === 10 || j === 11 ? '/andere' : OB(j)),
  'Politik und Gesellschaft': j => 'pug' + (j === 10 ? '/einstuendig' : j === 11 ? '/zweistuendig' : OB(j)),
  'Katholische Religionslehre': j => 'katholische-religionslehre' + OB(j),
  'Evangelische Religionslehre': j => 'evangelische-religionslehre' + OB(j),
  Ethik: j => 'ethik' + OB(j),
  Musik: j => 'musik' + OB(j),
  Kunst: j => 'kunst' + OB(j),
  Wirtschaftsinformatik: () => 'wirtschaftsinformatik',
};
export const URL = (fach, jgst) => {
  jgst = +jgst;
  if (SLUG[fach]) return `https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/${jgst}/${SLUG[fach](jgst)}`;
  let f = ({ Mathematik: 'mathematik', Physik: 'physik', Informatik: 'informatik', Deutsch: 'deutsch', Geschichte: 'geschichte', Latein: 'latein' })[fach] || '';
  if ((fach === 'Physik' && (jgst === 5 || jgst === 7)) || (fach === 'Informatik' && jgst < 8)) f = 'nt_gym';
  else if ((fach === 'Physik' || fach === 'Informatik' || fach === 'Geschichte') && jgst >= 12 || fach === 'Latein' && jgst === 12) f += '/grundlegend';
  else if (fach === 'Latein' && jgst >= 6 && jgst <= 8) f += '/1-fremdsprache';
  else if (fach === 'Informatik' && jgst === 11) f += '/ntg';
  else if (fach === 'Mathematik' && jgst === 12) f += '/regulaer';
  return `https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/${jgst}/${f}`;
};

const NT = 'Natur und Technik';
const GA = 'grundlegendes Anforderungsniveau', EA = 'erhöhtes Anforderungsniveau';
const L1 = 'Latein als 1. Fremdsprache', L2 = 'Latein als 2. Fremdsprache';
const NTG = 'Naturwissenschaftlich-technologisches Gymnasium (NTG)', CHA = 'HG, SG, MuG, WWG, SWG';
const WWG = 'Wirtschaftswissenschaftliches Gymnasium (WWG)';
const F2 = 'Französisch als 2. Fremdsprache', S3 = '3. Fremdsprache', G3 = '3. Fremdsprache';

const DEUTSCH_SEK1_TITEL = {
  '1.1': 'Verstehend zuhören', '1.2': 'Zu und vor anderen sprechen', '1.3': 'Mit anderen sprechen', '1.4': 'Szenisch spielen',
  '2.1': 'Lesetechniken und -strategien anwenden', '2.2': 'Literarische Texte verstehen und nutzen', '2.3': 'Pragmatische Texte verstehen und nutzen', '2.4': 'Weitere Medien verstehen und nutzen',
  '3.1': 'Über Schreibfertigkeiten bzw. -fähigkeiten verfügen', '3.2': 'Texte planen und schreiben', '3.3': 'Texte überarbeiten',
  '4.1': 'Sprachliche Verständigung untersuchen und reflektieren', '4.2': 'Sprachliche Strukturen untersuchen und reflektieren', '4.3': 'Richtig schreiben'
};
const D = o => Object.entries(o).map(([nr, k]) => [nr, DEUTSCH_SEK1_TITEL[nr], k]);

export const LP = {
  Mathematik: {
    5: [
      ['1.1', 'Natürliche Zahlen und ihre Erweiterung zu den ganzen Zahlen', ['Natürliche Zahlen ohne größtes Element', 'Zehnersystem als Stellenwertsystem', 'Natürliche Zahlen am Zahlenstrahl', 'Runden natürlicher Zahlen', 'Notwendigkeit negativer Zahlen', 'Ganze Zahlen ordnen, Beträge', 'Aussagen prüfen und widerlegen']],
      ['1.2', 'Addition und Subtraktion ganzer Zahlen', ['Schriftliche Addition und Subtraktion', 'Summen und Differenzen ganzer Zahlen', 'Gleichungen a + x = b, x − a = b, a − x = b', 'Kommutativ- und Assoziativgesetz', 'Termstruktur mit Klammern']],
      ['2', 'Geometrische Figuren und Lagebeziehungen', ['Punkte, Strecken, Geraden, Kreise im Koordinatensystem', 'Lagebeziehungen von Punkt, Gerade, Kreis', 'Punkte mit Abstandsbedingungen', 'Winkel messen und zeichnen bis 360°', 'Vierecke und ihre Eigenschaften']],
      ['3.1', 'Multiplikation und Division ganzer Zahlen', ['Schriftliche Multiplikation und Division', 'Primfaktorzerlegung, Teilbarkeitsregeln', 'Zählprinzip und Baumdiagramme', 'Vorzeichenregeln', 'Potenzen, Zehnerpotenzen, Quadratzahlen bis 400', 'Gleichungen a · x = b, x : a = b, a : x = b']],
      ['3.2', 'Verbindung der Grundrechenarten bei ganzen Zahlen', ['Termstrukturen mit Klammern', '„Punkt vor Strich“', 'Distributivgesetz, Kopfrechenstrategien', 'Vorwärts- und Rückwärtsarbeiten', 'Anwendungsaufgaben mit ganzen Zahlen']],
      ['4.1', 'Größen: Geld, Länge, Masse und Zeit', ['Umrechnen von Einheiten', 'Rechnen mit Größen, Kommaschreibweise', 'Schätzen und Plausibilität', 'Schlussrechnung (Dreisatz)', 'Sachaufgaben zum Maßstab']],
      ['4.2', 'Flächeninhalt', ['Flächeninhalt des Rechtecks', 'Flächeneinheiten umrechnen', 'Umfang und Flächeninhalt unterscheiden', 'Zerlegen und Ergänzen', 'Oberflächeninhalt von Quadern']]
    ],
    6: [
      ['1.1', 'Bruchteile und Bruchzahlen', ['Anteile in Diagrammen', 'Erweitern, Kürzen, Größenvergleich', 'Brüche am Zahlenstrahl, Zahlenmengen']],
      ['1.2', 'Dezimalbrüche', ['Stellenwerttafel, Kommaschreibweise, Runden', 'Endliche und periodische Dezimalbrüche', 'Umwandlung Bruch ↔ Dezimalbruch']],
      ['1.3', 'Addition und Subtraktion rationaler Zahlen', ['Rechenregeln für Brüche begründen', 'Brüche und Dezimalbrüche addieren/subtrahieren', 'Rechenvorteile nutzen', 'Terme mit Klammern', 'Überschlagsrechnung']],
      ['1.4', 'Multiplikation und Division rationaler Zahlen', ['Produkte und Quotienten', 'Potenzen mit rationalen Basen', 'Rechenvorteile durch Rechengesetze']],
      ['1.5', 'Verbindung der Grundrechenarten bei rationalen Zahlen', ['Terme mit Klammern berechnen', 'Kopfrechnen', 'Kommutativ-, Assoziativ-, Distributivgesetz', 'Anteile von Anteilen']],
      ['2.1', 'Flächeninhalt', ['Flächenformeln durch Zerlegen und Ergänzen', 'Parallelogramm, Dreieck, Trapez', 'Sachsituationen modellieren', 'Oberflächeninhalt einfacher Körper']],
      ['2.2', 'Volumen', ['Volumen des Quaders', 'Volumeneinheiten und Liter umrechnen', 'Näherungswerte für Alltagskörper', 'Zerlegen und Ergänzen']],
      ['3', 'Prozentrechnung, Daten und Diagramme', ['Prozentaufgaben mit Grundgleichung', 'Prozentangaben in Texten prüfen', 'Häufigkeiten und Diagramme', 'Manipulation durch Diagramme', 'Arithmetisches Mittel']]
    ],
    7: [
      ['1.1', 'Aufstellen und Interpretieren von Termen', ['Variablen nutzen', 'Termwerte berechnen', 'Tabellenkalkulation für Termwerte', 'Struktur von Termen']],
      ['1.2', 'Umformen von Termen', ['Potenzen zusammenfassen', 'Äquivalenz von Termen', 'Faktorisieren (Distributivgesetz)', 'Binomische Formeln', 'Terme im Sachzusammenhang']],
      ['2.1', 'Achsen- und punktsymmetrische Figuren', ['Symmetrische Figuren konstruieren', 'Mittelsenkrechte, Lot, Winkelhalbierende', 'Symmetrische Vierecke ordnen']],
      ['2.2', 'Winkelbetrachtungen an Figuren', ['Winkel an Geradenkreuzungen', 'Innenwinkelsumme im Dreieck', 'Innenwinkelsumme im Vieleck', 'Unbekannte Winkel bestimmen']],
      ['3', 'Lineare Gleichungen und Vertiefung der Prozentrechnung', ['Gleichungen aufstellen', 'Äquivalenzumformungen', 'Lösungen interpretieren', 'Komplexere Prozentaufgaben']],
      ['4', 'Kenngrößen von Daten', ['Arithmetisches Mittel und Median', 'Spannweite, Quartile, Boxplot', 'Kenngrößen deuten']],
      ['5', 'Kongruenz, besondere Dreiecke und Dreieckskonstruktionen', ['Kongruenz', 'Kongruenzsätze', 'Gleichschenklige und gleichseitige Dreiecke', 'Voraussetzung, Behauptung, Kehrsatz', 'Dynamische Geometriesoftware', 'Satz des Thales', 'Tangente an einen Kreis', 'Dreieckskonstruktionen']]
    ],
    8: [
      ['1', 'Funktion und Term', ['Zusammenhänge in Tabelle, Graph, Term', 'Funktion als eindeutige Zuordnung', 'Achsenschnittpunkte, Lage von Punkten']],
      ['2', 'Lineare Funktionen', ['Geradengleichung y = mx + t', 'Nullstellen und Schnittpunkte', 'Lineare Funktionen im Sachzusammenhang', 'Lineare Ungleichungen, Intervalle', 'Direkte Proportionalität']],
      ['3', 'Elementare gebrochen-rationale Funktionen', ['Definitionsmenge, Achsenschnittpunkte', 'Graphen mit Asymptoten', 'Indirekte Proportionalität']],
      ['4', 'Bruchterme und Bruchgleichungen', ['Bruchterme erweitern und kürzen', 'Rechnen mit Bruchtermen', 'Potenzgesetze mit ganzzahligen Exponenten', 'Bruchgleichungen lösen', 'Formeln umstellen']],
      ['5', 'Laplace-Experimente', ['Zufallsexperimente', 'Relative Häufigkeit, Gesetz der großen Zahlen', 'Laplace-Wahrscheinlichkeit', 'Zählprinzip und Baumdiagramme']],
      ['6', 'Lineare Gleichungssysteme', ['Sachzusammenhänge als LGS', 'Graphisch und rechnerisch lösen', 'Lösbarkeit und Lösungsvielfalt']],
      ['7', 'Kreis und Zylinder', ['Umfang und Flächeninhalt des Kreises, π', 'Schrägbild und Netz von Prisma und Zylinder', 'Volumen von Prisma und Zylinder', 'Formeln in Sachsituationen']]
    ],
    9: [
      ['1', 'Quadratwurzeln', ['Definition und Näherungswerte', 'Irrationalität von √2 (indirekter Beweis)', 'Heron-Verfahren mit Tabellenkalkulation', 'Rechengesetze für Wurzeln', 'Nenner rational machen, teilweise radizieren']],
      ['2.1', 'Quadratische Funktionen und quadratische Gleichungen', ['Wirkung der Parameter', 'Scheitelform (quadratische Ergänzung)', 'Eigenschaften am Graphen', 'Lösungsformel', 'Darstellungsformen quadratischer Terme']],
      ['2.2', 'Quadratische Funktionen in Anwendungen', ['LGS mit drei Unbekannten', 'Schnittpunkte Gerade–Hyperbel', 'Extremwertprobleme']],
      ['3', 'Wahrscheinlichkeit verknüpfter Ereignisse', ['Verknüpfte Ereignisse, Mengen', 'Vierfeldertafel', 'P(A ∪ B)']],
      ['4', 'Ähnlichkeit und Strahlensatz', ['Ähnliche Figuren', 'Strahlensätze anwenden', 'Flächen und Volumen beim Vergrößern']],
      ['5', 'Potenzfunktionen und Erweiterung des Potenzbegriffs', ['Graphen von a·xⁿ, Symmetrie', 'n-te Wurzel, Gleichungen xⁿ = c', 'Rationale Exponenten', 'Rechengesetze für Potenzen und Wurzeln']],
      ['6', 'Satz des Pythagoras', ['Beweis und Umkehrung', 'Berechnungen am rechtwinkligen Dreieck', 'Anwendungsaufgaben']],
      ['7.1', 'Trigonometrie am rechtwinkligen Dreieck', ['Seitenverhältnisse und Winkel', 'Sinus, Kosinus, Tangens', 'Anwendungsaufgaben']],
      ['7.2', 'Sinus- und Kosinussatz', ['Sinus und Kosinus am Einheitskreis', 'Sinussatz', 'Kosinussatz']]
    ],
    10: [
      ['1', 'Exponentielles Wachstum und Logarithmus', ['Exponentielle Zu- und Abnahme', 'Graphen von b·aˣ', 'Logarithmus', 'Exponentialgleichungen', 'Wachstums- und Zerfallsmodelle']],
      ['2', 'Zusammengesetzte Zufallsexperimente und Simulationen', ['Baumdiagramme, Urnenexperimente', 'Pfadregeln', 'Stochastische Simulation', 'Monte-Carlo-Methode für π']],
      ['3', 'Sinus- und Kosinusfunktion', ['Bogenmaß', 'Einheitskreis', 'Periodizität', 'Parameter a, b, c, d', 'Funktionsterm aus Graph', 'Periodische Vorgänge']],
      ['4', 'Ganzrationale Funktionen', ['Verhalten im Unendlichen, Nullstellen', 'Graph ↔ Term', 'Achsen- und Punktsymmetrie']],
      ['5', 'Fortführung der Raumgeometrie', ['Pyramide und Kegel: Schrägbild, Netz', 'Rotationskörper', 'Oberfläche des Kegels', 'Volumen von Prisma, Pyramide, Kegel', 'Kugel: Volumen und Oberfläche', 'Sachaufgaben']]
    ],
    11: [
      ['1', 'Spezielle Eigenschaften von Funktionen', ['Funktionstypen und Graphen', 'Grenzverhalten für x → ±∞', 'Symmetrie prüfen', 'Verschieben, Strecken, Spiegeln', 'Stetigkeit (anschaulich)']],
      ['2', 'Gebrochen-rationale Funktionen – Grenzwerte und Asymptoten', ['Definitionsmenge, Nullstellen', 'Waagrechte und schräge Asymptoten', 'Polstellen', 'Graph skizzieren']],
      ['3', 'Bedingte Wahrscheinlichkeit und stochastische Unabhängigkeit', ['Bedingte Wahrscheinlichkeit', 'Vierfeldertafel und Baumdiagramm', 'Stochastische Unabhängigkeit', 'Statistische Aussagen hinterfragen']],
      ['4.1', 'Lokales und globales Differenzieren', ['Differenzenquotient, Sekantensteigung', 'Differentialquotient, Tangentensteigung', 'Differenzierbarkeit', 'Ableitungsfunktion graphisch', 'Ableitungsregeln', 'Lokale Änderungsrate', 'Tangentengleichung']],
      ['4.2', 'Untersuchung ganzrationaler Funktionen', ['Monotonie und erste Ableitung', 'Krümmung, Wendestellen', 'Notwendige und hinreichende Bedingung', 'Kurvendiskussion', 'Newton-Verfahren']]
    ],
    12: [
      ['1.1', 'Ganzrationale Funktionen (mit Parametern)', ['Funktionenscharen', 'Stammfunktionen']],
      ['1.2', 'Natürliche Exponentialfunktion', ['eˣ als eigene Ableitung', 'Wachstumsvergleich', 'Verknüpfte Funktionen', 'Natürlicher Logarithmus', 'Wachstums- und Abklingvorgänge']],
      ['1.3', 'Sinus- und Kosinusfunktion', ['Ableitungen von sin und cos', 'Verknüpfungen mit linearen Funktionen']],
      ['2', 'Zufallsgrößen und Binomialverteilung', ['Axiomatische Wahrscheinlichkeit', 'Zufallsgröße, Erwartungswert, Varianz', 'Binomialkoeffizient', 'Bernoulli-Kette', 'Binomialverteilung']],
      ['3', 'Einseitiger Signifikanztest', ['Nullhypothese', 'Fehler erster und zweiter Art', 'Ablehnungsbereich', 'Fehlinterpretationen']],
      ['4.1', 'Gebrochen-rationale Funktionen', ['Quotientenregel', 'Kurvendiskussion']],
      ['4.2', 'Wurzelfunktion', ['Umkehrfunktion', 'Ableitung bei rationalen Exponenten', 'Verknüpfungen']],
      ['4.3', 'Natürliche Logarithmusfunktion', ['ln als Umkehrfunktion von eˣ', 'Ableitung, Rechenregeln, Grenzwerte']],
      ['5', 'Grundlagen der Koordinatengeometrie im Raum', ['Punkte und Körper im Raum', 'Vektoren addieren und vervielfachen', 'Skalarprodukt: Längen, Winkel', 'Vektorprodukt: Flächen, Volumina']]
    ],
    13: [
      ['1', 'Flächeninhalt und bestimmtes Integral', ['Integral als Flächenbilanz', 'Integralfunktion', 'Hauptsatz der Differential- und Integralrechnung', 'Integrationsregeln', 'Flächenberechnung, uneigentliche Integrale', 'Integral als Gesamtänderung', 'Rotationskörper']],
      ['2', 'Normalverteilung', ['Stetige Zufallsgrößen', 'Dichte- und Verteilungsfunktion', 'Sigma-Regeln']],
      ['3', 'Geraden und Ebenen im Raum', ['Geraden in Parameterform', 'Ebenen in Normalen- und Koordinatenform', 'Lagebeziehungen, Schnittwinkel', 'Abstände, Hesse’sche Normalform', 'Kugelgleichungen']],
      ['4', 'Anwendungen der Differential- und Integralrechnung', ['Funktionen mit Parametern', 'Bedingungen für Parameter', 'Extremwertprobleme', 'Sachanwendungen']]
    ]
  },

  Physik: {
    5: [
      ['1.1', 'Naturwissenschaftliches Arbeiten: Arbeitsmethoden', ['Messen, Sicherheitsregeln', 'Naturwissenschaftlicher Erkenntnisweg', 'Beobachten, Vergleichen', 'Protokoll', 'Modelle'], NT],
      ['1.2', 'Naturwissenschaftliches Arbeiten: Themenbereiche', ['Licht: Zerlegung, Linsen', 'Luft und Schall', 'Wasser: Aggregatzustände', 'Stoffe und Materialien', 'Teilchenmodell', 'Energieumwandlungen'], NT]
    ],
    7: [
      ['1.1', 'Physikalische Spielregeln der Natur', ['Permanentmagnete, Elementarmagnete', 'Erdmagnetfeld', 'Dichte bestimmen', 'Dichte als Stoffeigenschaft'], NT],
      ['1.2', 'Optische Phänomene', ['Farben beleuchteter Gegenstände', 'Lichtquellen, Sehvorgang', 'Absorption und Reflexion', 'Geradlinige Lichtausbreitung, Schatten', 'Mondphasen, Finsternisse'], NT],
      ['1.3', 'Elektrische Stromkreise', ['Elektrostatik, Ladungsarten', 'Kern-Hülle-Modell', 'Strom als Ladungsbewegung', 'Wärme- und Lichtwirkung', 'Magnetische Wirkung des Stroms', 'Schaltungen im Alltag'], NT]
    ],
    8: [
      ['1', 'Elektrischer Strom', ['Modell des Stromkreises', 'Stromstärke und Stromrichtung', 'Spannung als Antrieb', 'Gleich- und Wechselstrom', 'Kennlinien, Ohm’sches Gesetz', 'Elektrischer Widerstand', 'Leiter, Isolator, Kurzschluss', 'Haushaltsinstallation', 'Reihen- und Parallelschaltung']],
      ['2', 'Optik', ['Bild am ebenen Spiegel', 'Reflexionsgesetz, virtuelles Bild', 'Brechung', 'Abbildung mit Sammellinse', 'Reelle und virtuelle Bilder', 'Auge, Fehlsichtigkeit', 'Totalreflexion, Lichtleiter']],
      ['3.1', 'Dynamik zweidimensionaler Bewegungen', ['Betrag der Geschwindigkeit', 'Geschwindigkeit als Pfeil (2D)', 'Geschwindigkeitsänderung Δv durch Kraft', 'F·Δt = m·Δv, Masse als Trägheitsmaß', 'Beschleunigung, F = m·a', 'Beschleunigung messen']],
      ['3.2', 'Kräfte und ihre Wirkungen', ['Gewichtskraft, freier Fall', 'Kräfteaddition, Reibung, Luftwiderstand', 'Kräftegleichgewicht, Trägheitssatz', 'Schiefe Ebene', 'Statische Kraftmessung', 'Verformung, Hooke’scher Bereich']],
      ['4.1', 'Solarzellen und andere Elektrizitätsquellen', ['Solarmodule in Reihe und parallel', 'Äußere Einflüsse auf Solarzellen', 'Weitere Elektrizitätsquellen'], 'Profilbereich NTG'],
      ['4.2', 'Vertiefung prozessbezogener Kompetenzen', ['Einfache Geräte und Schaltungen bauen', 'Gewölbte Spiegel, Lupe, optische Instrumente', 'Farbmischung, Dispersion', 'Geschwindigkeit messen mit Sensoren', 'Videoanalyse im Sport'], 'Profilbereich NTG']
    ],
    9: [
      ['1.1', 'Mechanische Energie', ['Energieformen, Energieerhaltung', 'Höhenenergie und kinetische Energie', 'Energiebilanzen', 'Arbeit, Hubarbeit', 'Leistung']],
      ['1.2', 'Elektrische Energie', ['Ladung, Elementarladung', 'Spannung als Potentialdifferenz', 'Energie, Leistung, Spannung, Stromstärke', 'Leistung in Schaltungen', 'Wirkungsgrad']],
      ['2', 'Atome', ['Photonenmodell, Photonenenergie', 'Spektren', 'Energiestufenmodell', 'Absorption in der Erdatmosphäre']],
      ['3.1', 'Das Teilchenmodell', ['Absolute Temperatur', 'Innere Energie', 'Aggregatzustandsänderungen', 'Gasdruck', 'Druckunterschied und Teilchenströme']],
      ['3.2', 'Thermischer Energietransport und Einflüsse auf unser Klima', ['Wärmekapazität', 'Arbeit und Wärme', 'Wärmeleitung, Konvektion, Strahlung', 'Treibhauseffekt (Modellversuch)', 'Strahlungsgleichgewicht']],
      ['4.1', 'Klima', ['Thermische Ausdehnung, Meeresspiegel', 'Rückkopplungen', 'Kippelemente', 'Erklärungsansätze der Erderwärmung'], 'Profilbereich NTG'],
      ['4.2', 'Vertiefung prozessbezogener Kompetenzen', ['Energetik im Körper', 'Wärmedämmung bei Gebäuden', 'Energiemix', 'Regenerative Energiequellen', 'Fahrzeugantriebe', 'Druck in Flüssigkeiten und Gasen'], 'Profilbereich NTG']
    ],
    10: [
      ['1', 'Elektromagnetismus', ['Feldbegriff', 'Magnetfeld, Feldlinien', 'Kraft auf stromdurchflossenen Leiter, Lorentzkraft', 'Elektromotor', 'Induktion', 'Generator', 'Transformator']],
      ['2', 'Impulserhaltung in der Mechanik', ['Impuls als Erhaltungsgröße', 'Impuls- und Energieerhaltung bei Stößen', 'Wechselwirkungsgesetz']],
      ['3', 'Bewegungen und ihre Modellierung', ['t-x- und t-v-Diagramme', 'Gleichmäßig beschleunigte Bewegung, freier Fall', 'Waagrechter Wurf', 'Koordinatenschreibweise', 'Erhaltungssätze anwenden']],
      ['4', 'Kernphysik', ['Entdeckung der Radioaktivität', 'α-, β-, γ-Strahlung', 'Atomkern, Quarks', 'Masse-Energie-Äquivalenz', 'Halbwertszeit', 'Strahlenschutz']],
      ['5.1', 'Halbleiterbauelemente in Experimenten', ['Diodenkennlinie', 'Transistor als Schalter', 'Modelle zu Halbleitern'], 'Profilbereich NTG'],
      ['5.2', 'Vertiefung prozessbezogener Kompetenzen', ['Mikroprozessoren', 'Physik im Sport', 'Physik des Fliegens', 'Kausalität und Chaos', 'Anwendungen der Radioaktivität', 'Kernkraftwerkstechnik', 'Magnete in der Fahrzeugtechnik'], 'Profilbereich NTG']
    ],
    11: [
      ['1', 'Kreisbewegung', ['Winkelgeschwindigkeit', 'Zentripetalkraft', 'Gravitationsgesetz']],
      ['2', 'Schwingungen und Wellen', ['Harmonische Schwingung', 'Fadenpendel', 'Longitudinal- und Transversalwellen', 'Beugung, Interferenz, stehende Wellen', 'Doppelspalt', 'Wellen- und Photonenmodell des Lichts']],
      ['3.1', 'Astronomische Weltbilder', ['Geozentrisch und heliozentrisch', 'Kepler’sche Gesetze', 'Urknall, Expansion']],
      ['3.2', 'Einblick in die spezielle Relativitätstheorie', ['Einstein’sche Postulate', 'Relativität der Gleichzeitigkeit', 'Zeitdilatation, Längenkontraktion']],
      ['3.3', 'Energieversorgung', ['Reversibel und irreversibel, Wirkungsgrad', 'Energiequellen', 'Energieeffizienz']],
      ['4.1', 'Die Methode der kleinen Schritte', ['Bewegungen modellieren', 'Freier Fall, Schwingung'], 'Profilbereich NTG'],
      ['4.2', 'Photovoltaik in Anwendungen', ['Kennlinie und Leistung von Solarzellen', 'PV-Anlagen', 'Beitrag zur Energieversorgung'], 'Profilbereich NTG']
    ],
    12: [
      ['1', 'Statische elektrische und magnetische Felder', ['Feldlinien, Feldstärke', 'Superposition', 'Plattenkondensator: Kapazität, Energie', 'RC-Glied', 'Potential und Spannung', 'Teilchen im elektrischen Feld', 'Magnetische Flussdichte, Spule', 'Lorentzkraft, Kreisbahnen'], GA],
      ['2', 'Elektromagnetische Induktion und Schwingungen', ['Magnetischer Fluss, Induktionsgesetz', 'Selbstinduktion, Induktivität', 'Technische Anwendungen', 'Elektromagnetischer Schwingkreis'], GA],
      ['3', 'Elektromagnetische Wellen', ['Dipolstrahlung', 'Mikrowellen', 'Interferenz, stehende Wellen', 'Doppelspalt und Gitter', 'Wellenlänge von LEDs', 'Röntgenröhre', 'Elektromagnetisches Spektrum'], GA],
      ['1', 'Statische elektrische und magnetische Felder', ['Feldstärke, Coulombkraft', 'Radialsymmetrisches Feld', 'Plattenkondensator, Materie im Feld', 'RC-Glied', 'Potential und Spannung', 'Teilchen in E- und B-Feldern', 'Lorentzkraft, Kreisbahnen', 'Massenspektrometer, Hall-Effekt, Beschleuniger'], EA],
      ['2', 'Elektromagnetische Induktion und Schwingungen', ['Induktionsgesetz', 'Selbstinduktion, Spulenenergie', 'RL-Glied', 'LC-Kreis, Thomson-Gleichung', 'Gedämpfte Schwingung, Resonanz', 'Zeigerdiagramme', 'Wechselstromkreis'], EA],
      ['3', 'Elektromagnetische Wellen', ['Hertz’scher Dipol', 'Maxwellgleichungen (qualitativ)', 'Beschreibung einer Welle', 'Doppelspalt, Gitter, Einfachspalt', 'Bragg-Bedingung', 'Röntgenspektrum', 'Elektromagnetisches Spektrum'], EA],
      ['4', 'Experimentelles Arbeiten', ['Kondensator laden und entladen', 'Potentialmessungen', 'Hall-Sonde', 'Induktion', 'Schwingungen', 'Interferenz mit Licht'], EA]
    ],
    13: [
      ['1.1', 'Eigenschaften von Quantenobjekten', ['Elektronenbeugung', 'Doppelspalt mit Elektronen', 'de-Broglie-Wellenlänge', 'Photon: Welle und Teilchen', 'Energie und Impuls des Photons'], GA],
      ['1.2', 'Weltbild der Quantenphysik', ['Wellenfunktion, Nachweiswahrscheinlichkeit', 'Komplementarität', 'Messprozess, Nicht-Lokalität'], GA],
      ['2', 'Ein Atommodell der Quantenphysik', ['Potentialtopf', 'Orbitale, Quantenzahlen', 'Energieniveaus des Wasserstoffs', 'Emission und Absorption', 'Franck-Hertz-Versuch'], GA],
      ['3', 'Strukturuntersuchungen zum Aufbau der Materie', ['Methoden der Strukturuntersuchung', 'Standardmodell'], GA],
      ['4.1', 'Ein einfaches Kernmodell', ['Massendefekt, Bindungsenergie', 'Potentialtopfmodell des Kerns', 'α-, β-, γ-Strahlung, Tunneleffekt', 'Energiebilanzen'], GA],
      ['4.2', 'Radioaktivität und Kernenergietechnik', ['Nachweis ionisierender Strahlung', 'Zerfallsgesetz, Halbwertszeit', 'C14-Methode', 'Strahlenschutz, Dosis', 'Kernspaltung, Reaktor'], GA],
      ['1.1', 'Eigenschaften von Quantenobjekten', ['Elektronenbeugung, Bragg-Reflexion', 'de-Broglie-Beziehung', 'Doppelspalt-Simulation', 'Einzelphotonen, Mach-Zehnder-Interferometer', 'Photoeffekt, Einstein-Gleichung'], EA],
      ['1.2', 'Weltbild der Quantenphysik', ['Wellenfunktion, Superposition', 'Unbestimmtheitsrelation', 'Messprozess', 'Quantenradierer', 'Delayed-Choice', 'Dekohärenz'], EA],
      ['2', 'Ein Atommodell der Quantenphysik', ['Potentialtopf', 'Wasserstoffatom: Orbitale, Energiewerte', 'Spektrometer', 'Pauli-Prinzip', 'Franck-Hertz-Versuch'], EA],
      ['3', 'Strukturuntersuchungen zum Aufbau der Materie', ['Methoden im Überblick', 'Standardmodell', 'Röntgenstrukturanalyse'], EA],
      ['4.1', 'Ein einfaches Kernmodell', ['Massendefekt, Bindungsenergie', 'Potentialtopfmodell', 'Zerfallsarten', 'Zerfallsreihe, Nuklidkarte', 'Erhaltungssätze'], EA],
      ['4.2', 'Radioaktivität und Kernenergietechnik', ['Nachweis der Strahlung', 'Zerfallsgesetz', 'Altersbestimmung', 'Strahlenschutz', 'Kernspaltung, Reaktor'], EA],
      ['5', 'Experimentelles Arbeiten', ['Polarisation', 'Elektronenbeugung', 'Planck’sches Wirkungsquantum', 'Spektrometer', 'Absorption von Strahlung'], EA]
    ]
  },

  Informatik: {
    6: [
      ['2.1', 'Informationsdarstellung mit Grafik-, Text- und Multimediadokumenten', ['Objekt, Attribut, Methode, Klasse', 'Vektorgrafik modellieren', 'Textdokumente modellieren', 'Objekt- und Klassendiagramm', 'Punktnotation', 'Vektor- und Pixelgrafik'], NT],
      ['2.2', 'Projekt: Multimediapräsentation', ['Qualitätskriterien', 'Urheberrecht, Quellenangabe'], NT],
      ['2.3', 'Hierarchische Informationsstrukturen – Dateisystem', ['Klassen DATEI und ORDNER', 'Baum: Wurzel, Knoten, Blatt, Pfad'], NT]
    ],
    7: [
      ['2.1', 'Vernetzte Informationsstrukturen', ['Hypertext, Klasse VERWEIS', 'Graph aus Knoten und Kanten', 'Internet: Client, Server, Router', 'Suchmaschinen'], NT],
      ['2.2', 'Chancen und Risiken digitaler Kommunikation', ['E-Mail, Messenger, soziale Netzwerke', 'Firewall, Virenschutz, Passwörter', 'Datenschutz, Persönlichkeitsrecht', 'Cybermobbing'], NT],
      ['2.3', 'Beschreibung von Abläufen durch Algorithmen', ['Algorithmusbegriff', 'Sequenz, Verzweigung, Wiederholung'], NT],
      ['2.4', 'Projekt', ['Zeitmanagement, Arbeitsteilung, Dokumentation'], NT]
    ],
    9: [
      ['1', 'Funktionen und Datenflüsse, Tabellenkalkulation', ['Tabellenblatt, Zelle, Formel', 'Relative und absolute Zellbezüge', 'Datenflussdiagramm', 'Funktionen, Verkettung, Parameter']],
      ['2', 'Datenmodellierung und relationale Datenbanksysteme', ['Objekt, Klasse, Attribut', 'Tabellenschema, Primärschlüssel', 'Datenbank, DBMS, Datensatz', 'SQL: SELECT, FROM, WHERE']],
      ['3', 'Objektorientierte Modellierung und Programmierung', ['Objekt, Klasse, Attribut, Methode', 'Variablen, Parameter, lokale Variable', 'Wertzuweisung', 'Methodenkopf, Rückgabewert, Konstruktor', 'Algorithmen, Pseudocode', 'Datentypen', 'Vererbung, Überschreiben']],
      ['4', 'Datenschutz', ['Datenschutzgesetze, Betroffenenrechte', 'Personenbezogene Daten', 'Identitätsdiebstahl', 'Data-Mining']]
    ],
    10: [
      ['1', 'Datenmodellierung und relationale Datenbanksysteme', ['Objektorientiertes Datenmodell', 'Relationales Modell', 'Redundanz, Konsistenz, Anomalien', 'SQL über verknüpfte Tabellen (JOIN)']],
      ['2', 'Objektorientierte Modellierung und Programmierung', ['Array', 'Klassen als Datentypen', 'Referenzen, Klassenbeziehungen', 'Methodenaufrufe, Datenkapselung', 'Polymorphismus, Überschreiben']],
      ['3', 'Projekt', ['Datenbank- oder Softwareprojekt']]
    ],
    11: [
      ['1', 'Algorithmik', ['Variablen, Datentypen, Zuweisung', 'Sequenz, Verzweigung, Wiederholung', 'Funktionen: Parameter, Rückgabewert'], 'MuG, SWG, SG'],
      ['2', 'Codierung und Verschlüsselung', ['Binär- und Hexadezimalcodierung', 'Symmetrische und asymmetrische Verschlüsselung', 'Brute-Force', 'Digitale Signatur, Zertifikat'], 'MuG, SWG, SG'],
      ['3', 'Kommunikation in Netzwerken, Internet', ['Aufbau des Internets', 'Schichtenmodell', 'Protokolle', 'WWW, HTML, Cookies', 'Datenschutz'], 'MuG, SWG, SG'],
      ['4', 'Künstliche Intelligenz', ['Trainings- und Testdaten', 'Perzeptron, Delta-Lernregel'], 'MuG, SWG, SG'],
      ['–', 'Graphen', ['Knoten und Kanten', 'Gerichtete und gewichtete Graphen', 'Adjazenzmatrix', 'Graphen durchlaufen'], 'NTG'],
      ['–', 'Kommunikation in Netzwerken, Internet', ['Schichtenmodell', 'Protokolle', 'Aufbau des Internets'], 'NTG']
    ],
    12: [
      ['1', 'Rekursion', ['Rekursiver Aufruf, Abbruchbedingung', 'Lineare und verzweigte Rekursion', 'Tiefensuche'], GA],
      ['2', 'Listen', ['Einfach verkettete Liste', 'Trennung von Struktur und Daten', 'Kompositum', 'Sequenzdiagramm', 'Stapel und Warteschlange'], GA],
      ['3', 'Binärbäume', ['Wurzel, Knoten, Kante, Blatt, Pfad', 'Vollständig, balanciert, entartet', 'Geordneter Binärbaum: Einfügen, Suchen', 'Preorder, Inorder, Postorder'], GA],
      ['4', 'Nebenläufige Prozesse', ['Synchronisation, kritischer Abschnitt', 'Betriebsmittelzuteilungsgraph, Verklemmung', 'Coffman-Bedingungen', 'Monitor, Threads', 'Erzeuger-Verbraucher, Philosophen'], GA],
      ['5', 'Informationssicherheit', ['Schutzziele', 'Gefährdungen', 'Schadprogramme, DDoS', 'Sicherheitsmaßnahmen'], GA],
      ['6', 'Praktische Softwareentwicklung, Projekt', ['Bibliotheksklassen', 'Model-View-Controller', 'Projektplanung', 'Wasserfallmodell', 'Agile Entwicklung', 'Testen, Debuggen', 'Refaktorierung'], GA],
      ['1', 'Rekursion', ['Rekursiver Aufruf, Abbruchbedingung', 'Rekursionsarten', 'Tiefensuche'], EA],
      ['2', 'Listen', ['Einfach verkettete Liste', 'Trennung von Struktur und Daten', 'Kompositum', 'Sequenzdiagramm', 'Stapel und Warteschlange'], EA],
      ['3', 'Bäume', ['Baumbegriffe', 'Binärbaum', 'Geordneter Binärbaum', 'Kompositum', 'Traversierung'], EA],
      ['4', 'Funktionsweise eines Rechners', ['Von-Neumann-Modell, Bussystem', 'Zweierkomplement, Überlauf', 'Logikgatter, Addierer', 'Disjunktive Normalform', 'Registermaschine', 'Assembler'], EA],
      ['5', 'Betriebssysteme, Prozesse und Nebenläufigkeit', ['Aufgaben des Betriebssystems', 'Kernel, Systemaufruf', 'Zugriffsrechte', 'Scheduling', 'Synchronisation, Verklemmung', 'Monitor, Semaphor, Threads'], EA],
      ['6', 'Informationssicherheit', ['Schutzziele', 'Gefährdungskategorien', 'Sicherheitsmaßnahmen'], EA],
      ['7', 'Praktische Softwareentwicklung, Projekt', ['Softwarequalität, Ergonomie', 'Observer, MVC', 'Projektplanung', 'Wasserfallmodell, agile Entwicklung', 'Testen', 'Refaktorierung', 'Dokumentation'], EA]
    ],
    13: [
      ['1', 'Formale Sprachen und Automaten', ['Alphabet, Wort, Sprache', 'Grammatik', 'Syntaxdiagramm, EBNF', 'Ableitungsbaum', 'Endlicher Automat'], GA],
      ['2', 'Funktionsweise eines Rechners', ['Von-Neumann-Architektur', 'Registermaschine', 'Kontrollstrukturen in Assembler'], GA],
      ['3', 'Grenzen der Berechenbarkeit', ['Laufzeitaufwand', 'Best, Average, Worst Case', 'Brute-Force', 'Halteproblem'], GA],
      ['4', 'Künstliche Intelligenz', ['Neuronales Netz: Schichten, Gewichte', 'Forward- und Backpropagation', 'k-Means-Clustering', 'Überwachtes, unüberwachtes, bestärkendes Lernen', 'Ethische Fragen'], GA],
      ['1', 'Internet der Dinge', ['Physical Computing', 'Client-Server-Anwendung', 'Einfaches IoT-System'], EA],
      ['2', 'Künstliche Intelligenz', ['Maschinelle Lernverfahren anwenden', 'Daten vorbereiten', 'Ergebnisse bewerten', 'Neuronale Netze'], EA],
      ['3', 'Formale Sprachen und Automaten', ['Grammatik, EBNF', 'Endlicher Automat', 'Nichtdeterminismus', 'Turing-Maschine'], EA],
      ['4', 'Algorithmen, Komplexität und Berechenbarkeit', ['Algorithmen entwerfen und analysieren', 'Laufzeitkomplexität', 'Halteproblem'], EA]
    ]
  },

  Geschichte: {
    6: [
      ['1', 'Der Mensch und seine Geschichte', ['Zeit als zentrale Dimension', 'Formen geschichtlicher Überlieferung', 'Jäger und Sammler der Altsteinzeit', 'Bauern der Jungsteinzeit']],
      ['2', 'Ägypten – eine frühe Hochkultur', ['Nutzung der Stromlandschaft', 'Herrschaft, Religion und Gesellschaft']],
      ['3', 'Die griechische Antike', ['Landesnatur, Polis, Kolonisation', 'Mythen, Epen, Spiele, Theater', 'Attische Polis ab Solon', 'Blütezeit Athens unter Perikles']],
      ['4', 'Menschen machen Geschichte (Längsschnitt)', ['Porträt einer Herrscherin', 'Politik und Strategie', 'Feldherr und Eroberer']],
      ['5', 'Das Imperium Romanum', ['Anfänge Roms', 'Römische Republik: Gesellschaft und Macht', 'Von der Republik zum Prinzipat', 'Römische Herrschaft in den Provinzen', 'Jüdisches Leben im Römischen Reich', 'Christen im Römischen Reich']],
      ['6', 'Von der Antike zum Mittelalter', ['„Völkerwanderung“, Zerfall des Römischen Reichs', 'Ausbreitung des Islam', 'Reichsbildung der Franken', 'Entstehung des mittelalterlichen Kaisertums']],
      ['7', 'Leben in der Familie (Längsschnitt)', ['Geschlechterrollen in Athen', 'Die römische „familia“', 'Neue Rollenbilder heute']]
    ],
    7: [
      ['1', 'König und Reich: Herrschaft im Mittelalter', ['Entstehung des Ottonischen Reichs', 'Reichskirche, Investiturstreit', 'Wahlkönigtum, Lehnswesen, Territorialisierung']],
      ['2', 'Leben und Kultur im Mittelalter', ['Stände, Grundherrschaft', 'Rolle der Klöster', 'Rittertum, Romanik, Gotik', 'Stadt im Mittelalter', 'Äußere Bedrohungen']],
      ['3', 'Neue räumliche und geistige Horizonte', ['Kreuzzüge: Konfrontation und Kulturbegegnung', 'Eroberung Konstantinopels', 'Renaissance, Humanismus, Buchdruck', 'Entdeckungsfahrten und ihre Folgen']],
      ['4', 'Wirtschaft und Handel gestern und heute (Längsschnitt)', ['Handel am Limes', 'Handelsmacht China im Mittelalter', 'Hanse oder Fugger', 'Welthandel heute']],
      ['5', 'Das konfessionelle Zeitalter', ['Krisen im 16. Jh., Hexenverfolgung', 'Reformation, Bauernkrieg, Spaltung', 'Dreißigjähriger Krieg']],
      ['6', 'Absolutismus und Barock', ['Absolutismus in Frankreich', 'Barock als Repräsentation', 'Absolutismus an einem Landesbeispiel', 'Hegemonie und „balance of power“']],
      ['7', 'Bauwerke als Ausdruck politischen Denkens (Längsschnitt)', ['Bauwerk der griechischen Antike', 'Kaiserpfalz Aachen', 'Barocker Repräsentationsbau', 'Modernes Bauwerk, z. B. Reichstag']]
    ],
    8: [
      ['1', 'Aufklärung, Französische Revolution und Napoleon', ['Ursachen der Französischen Revolution', 'Verlauf der Revolution bis 1794', 'Kaisertum Napoleons', 'Montgelas’ Reformen in Bayern']],
      ['2', 'Deutschland zwischen Restauration und Revolution', ['Nationalidee, Befreiungskriege', 'Wiener Kongress, Deutscher Bund', 'Liberale und nationale Bewegung', 'Revolution von 1848/49']],
      ['3', 'Bayern – Identität, Staatsgebiet und kulturelles Erbe (Längsschnitt)', ['Bevölkerungsgruppen und Zuwanderung', 'Territoriale Entwicklung Bayerns', 'Städte und Baudenkmäler']],
      ['4', 'Industrialisierung und Soziale Frage', ['Industrialisierung in England', 'Industrialisierung in Deutschland und Bayern', 'Arbeits- und Lebensbedingungen', 'Soziale Frage und Lösungsansätze']],
      ['5', 'Das Deutsche Kaiserreich', ['Reichsgründung 1871', 'Verfassung, Parteien, Sozialdemokratie', 'Obrigkeitsstaat, Militarismus, Nationalismus', 'Massengesellschaft, Frauenbewegung']],
      ['6', 'Imperialismus und Erster Weltkrieg', ['Imperialistische Politik', 'Weg in den Ersten Weltkrieg', 'Neue Dimension des Krieges', 'Epochenjahr 1917', 'Friedensverträge, Kriegsschuldfrage']]
    ],
    9: [
      ['1', 'Weimarer Republik – die erste deutsche Demokratie', ['Novemberrevolution, Reichsverfassung', 'Belastungen der Republik', 'Krisenjahre bis 1923', 'Stabilisierung', 'Weltwirtschaftskrise und Ende']],
      ['2', 'Nationalsozialismus, Zweiter Weltkrieg und Holocaust', ['NS-Ideologie', 'Machtausbau', 'NS in Bayern', 'Leben im totalitären Staat', 'Eroberungspolitik', 'Entrechtung, Verfolgung, Ermordung', 'Widerstand', 'Kriegsende in Europa und Asien']],
      ['3', 'Rechte des Menschen gestern und heute (Längsschnitt)', ['Ständegesellschaft', 'Aufklärung, Menschenrechtserklärungen', 'Grundrechte in vier Epochen', 'UN-Charta, Europäische Menschenrechtskonvention']],
      ['4', 'Deutschland und die Siegermächte 1945–1949', ['Potsdamer Konferenz', 'Das besiegte Deutschland', 'Zerfall der Anti-Hitler-Koalition', 'Doppelte Staatsgründung']],
      ['5', 'Weltpolitik im Kalten Krieg', ['Blockbildung', 'Kuba-Krise', 'Vietnamkrieg', 'Entspannung und Ende des Ost-West-Konflikts', 'Entkolonialisierung']]
    ],
    10: [
      ['1', 'Das geteilte Deutschland und die Wiedervereinigung', ['SED-Diktatur und Alltag in der DDR', 'Widerstand und Unterdrückung in der DDR', 'Ära Adenauer', 'Bundesrepublik ab den 1960ern', 'Jüdisches Leben nach 1945', 'Deutsch-deutsche Beziehungen', 'Wiedervereinigung']],
      ['2', 'Europäische Integration und globalisierte Welt', ['Europäische Integration bis 2009', 'Weltpolitische Akteure nach 1990', 'Globalisierung, Terrorismus', 'Rolle der Bundesrepublik nach 1990']]
    ],
    11: [
      ['1', 'Geschichte erinnern', ['Mittelalter in der Populärkultur', 'Deutsche Kolonialgeschichte', 'Erinnern an Holocaust/Shoa', 'Manipulativer Umgang mit der NS-Zeit', 'Zeitzeugen zur DDR', 'Geschichte als Erzählung, Gedächtnis', 'Historische Verantwortung heute']],
      ['2', 'Migration in Bayern (Frühe Neuzeit bis 20. Jh.)', ['Religiös motivierte Migration', 'Arbeits- und politische Migration im 19. Jh.', 'Gewaltmigration im Nationalsozialismus', 'Immigration und Integration nach 1945']]
    ],
    12: [
      ['1.1', 'Revolution 1848/49 und bürgerliche Gesellschaft', ['Vormärz', 'Voraussetzungen der Revolution', 'Märzereignisse, Paulskirche', 'Bilanz und Wirkungen'], GA],
      ['1.2', 'Modernisierung in Kaiserreich und Weimarer Republik', ['Wandel von Bürgertum und Adel', 'Politisches System des Kaiserreichs', 'Soziale Frage, Arbeiterbewegung', 'Novemberrevolution 1918', 'Weimarer Reichsverfassung', 'Frauenbewegung, Medien, jüdische Bevölkerung'], GA],
      ['2.1', 'Scheitern der Weimarer Republik – NS-Diktatur und Völkermord', ['Krise der Demokratie', 'NS-Weltanschauung, Propaganda', 'Entrechtung und Verfolgung', 'Holocaust/Shoa', 'Rolle der nichtjüdischen Bevölkerung'], GA],
      ['2.2', 'Bundesrepublik Deutschland und DDR', ['Staatsgründungen im Kalten Krieg', 'Wirtschaft und Lebensverhältnisse', 'Wiedervereinigung, Bürgerrechtsbewegung'], GA],
      ['2.3', 'Die Bundesrepublik 1990 bis 2009', ['Aufarbeitung der SED-Diktatur', 'Folgen der Wiedervereinigung', 'Extremismus und Terrorismus', 'Außenpolitische Rolle'], GA]
    ],
    13: [
      ['1', 'Akteure internationaler Politik in historischer Perspektive', ['Diaspora und Zionismus', 'Gründung Israels', 'Nahostkonflikt bis 1967', 'Friedensbemühungen', 'USA im Kalten Krieg', 'Zerfall der Sowjetunion', 'Aufstieg Chinas', 'Großmächte in der UNO'], GA],
      ['2', 'Historische Grundlagen politischer Ordnungen in Europa', ['Attische Demokratie', 'Herrschaft im Heiligen Römischen Reich', 'Politisches Denken der Aufklärung', 'Nationsvorstellungen um 1800', 'Nationalstaatsbildung im 19. Jh.', 'Deutsch-französische Selbst- und Fremdbilder', 'Überwindung des Nationalismus nach 1945'], GA]
    ]
  },

  Latein: {
    5: [
      ['1', 'Texte', ['Lehrbuchtexte übersetzen', 'Rom, Politik, Alltag, Mythos', 'Texte vortragen'], L1],
      ['2.2', 'Formenlehre', ['Grammatische Grundbegriffe', 'Nomina, Pronomina, Verben bestimmen', 'Zahlen 1 bis 12', 'Korrekte Wortformen bilden'], L1],
      ['2.3', 'Satzlehre', ['Satzglieder, Kongruenz, Kasusfunktionen', 'Tempora, Satzarten', 'Adverbial- und Relativsätze', 'AcI (gleichzeitig, vorzeitig)', 'Satzbau Latein – Deutsch'], L1],
      ['3', 'Kultureller Kontext', ['Topografie Roms', 'Römische Kunst und Architektur', 'Römische Werte, Senat', 'Alltag und Privatleben', 'Religion, Götter, Unterwelt', 'Herakles, Aeneas, Gründungsmythos', 'Geflügelte Worte'], L1]
    ],
    6: [
      ['1', 'Texte', ['Pompeji, Herkulaneum, Vesuv', 'Rom und Karthago', 'Ständegesellschaft, fides', 'Religion und Mythos'], L1],
      ['2.2', 'Formenlehre', ['3. Deklination; dives, pauper, vetus', 'hic, ille, iste, idem, ipse', 'Kardinalia bis 1000', 'Passiv aller Tempora', 'Konjunktiv Imperfekt/Plusquamperfekt', 'Partizip Präsens und Perfekt'], L1],
      ['2.3', 'Satzlehre', ['Prädikativum', 'Doppelter Nominativ/Akkusativ', 'Genitivus subiectivus/obiectivus', 'Irrealis, Konjunktiv im Nebensatz', 'Final- und Konsekutivsätze, cum, ut', 'AcI passiv', 'Participium coniunctum'], L1],
      ['3', 'Kultureller Kontext', ['Vesuvausbruch, Plinius d. J.', 'Republik, Punische Kriege', 'Attische Demokratie, Archimedes', 'Klientelwesen, Volkstribunat', 'Europa, Theseus, Daedalus und Ikarus', 'Trojanischer Krieg, Odysseus', 'Ovid als Mythenquelle'], L1],
      ['1', 'Texte', ['Forum Romanum, Pompeji, Vesuv', 'Senat, pietas', 'Familie, Sklaven, Gladiatoren', 'Olympier, Trojanischer Krieg, Aeneas'], L2],
      ['2.2', 'Formenlehre', ['1.–3. Deklination', 'Personal-, Possessiv-, Reflexivpronomen; is, qui', 'Zahlen 1 bis 12', 'Alle Konjugationen; esse, posse, velle, ire', 'Indikativ Aktiv aller Tempora', 'Perfektbildung, Stammformen'], L2],
      ['2.3', 'Satzlehre', ['Satzglieder, Kongruenz (KNG)', 'Kasusfunktionen', 'Imperfekt und Perfekt', 'Relativsatz, Adverbialsätze', 'AcI (gleichzeitig, vorzeitig)'], L2],
      ['3', 'Kultureller Kontext', ['Forum, Kolosseum, Thermen, Ostia', 'Vesuvausbruch 79 n. Chr.', 'Romulus und Remus, Königszeit', 'Ständekämpfe', 'Familie, Namen, Schule, Sklaven', 'Tempel, Orakel, Opfer', 'Herakles, Aeneas'], L2]
    ],
    7: [
      ['1', 'Texte', ['Imperium Romanum, Weltwunder', 'Alexander, späte Republik, Augustus', 'Karriere, Militär, virtus', 'Delphi, Olympia, Ödipus und Antigone'], L1],
      ['2.2', 'Formenlehre', ['Steigerung der Adjektive', 'Interrogativ- und Indefinitpronomen', 'Adverbbildung und Steigerung', 'Deponentien (a-/e-Konjugation), ferre', 'Konjunktiv Präsens/Perfekt', 'Partizip/Infinitiv Futur, Gerundium'], L1],
      ['2.3', 'Satzlehre', ['Ablativus absolutus', 'Ablativ des Vergleichs', 'Begehrsätze', 'Optativ, Hortativ, Jussiv, Prohibitiv', 'Consecutio temporum', 'AcI nachzeitig'], L1],
      ['3', 'Kultureller Kontext', ['Cumae, Delphi, Olympia, Sizilien', 'Provinzen und Verwaltung', 'Bürgerkriege, pax Augusta', 'Caesar, Kleopatra, Augustus, Cicero', 'Cursus honorum, Triumphzüge', 'Thebanischer Sagenkreis'], L1],
      ['1', 'Texte', ['Ödipus, Antigone, Orpheus und Eurydike', 'Karthago, Alexander, Militär', 'fides, virtus', 'Imperium Romanum, Weltwunder'], L2],
      ['2.2', 'Formenlehre', ['4. und 5. Deklination', 'hic, ille, iste, idem, ipse', 'Zahlen bis 1000', 'Passiv aller Tempora, ferre', 'Konjunktiv (alle Tempora)', 'Partizip Präsens und Perfekt'], L2],
      ['2.3', 'Satzlehre', ['Prädikativum', 'Genitivus subiectivus/obiectivus', 'Irrealis, consecutio temporum', 'cum- und ut-Sätze', 'AcI passiv', 'Participium coniunctum, Ablativus absolutus'], L2],
      ['3', 'Kultureller Kontext', ['Provinzen, Karthago, Theben', 'Punische Kriege, Bürgerkriege, Augustus', 'Alexander, Hellenismus, Diogenes', 'Cicero, Caesar, Horaz, Ovid', 'Cursus honorum, Triumphzüge', 'Europa, Theseus, Daedalus und Ikarus'], L2]
    ],
    8: [
      ['1', 'Texte', ['Kaiserzeit, Christen, Germanen', 'Rechtswesen, iustitia', 'Mythos, Religion, Philosophie', 'Fabeln des Phaedrus'], L1],
      ['2.2', 'Formenlehre', ['quidam, quisque; quisquis, quicumque', 'Korrelativa', 'Deponentien, Semideponentien', 'Perfektopräsentien, fieri', 'Gerundiv'], L1],
      ['2.3', 'Satzlehre', ['Attributives und prädikatives Gerundiv', 'NcI', 'Genitiv des geteilten Ganzen, Dativ des Urhebers', 'Deliberativ, Potentialis', 'Konjunktiv im Relativsatz', 'Verschränkte Relativsätze'], L1],
      ['3', 'Kultureller Kontext', ['Kaiserzeit, Christentum, „Caesarenwahn“', 'Limes, Germanen', 'Latein in Mittelalter und Humanismus', 'Römisches Recht heute', 'Stoiker, Epikureer, Seneca', 'interpretatio Romana'], L1],
      ['1', 'Texte', ['Kaiserzeit, Christen, Germanen', 'Rechtswesen, iustitia', 'Delphi, Olympia', 'Fabeln des Phaedrus'], L2],
      ['2.2', 'Formenlehre', ['Steigerung der Adjektive und Adverbien', 'aliquis, quidam, quisque, quisquis', 'Korrelativa', 'Partizip/Infinitiv Futur', 'Deponentien, Semideponentien, fieri', 'Gerundium, Gerundiv'], L2],
      ['2.3', 'Satzlehre', ['Gerundiv, NcI', 'Genitiv/Ablativ der Beschaffenheit', 'Ablativ des Vergleichs', 'Hortativ, Jussiv, Optativ, Prohibitiv', 'Konjunktiv im Relativsatz', 'AcI nachzeitig'], L2],
      ['3', 'Kultureller Kontext', ['Kaiserzeit, Christentum', 'Limes, Germanen', 'Verbreitung des Lateinischen', 'Römisches Recht', 'Delphi, Olympia, Philosophie', 'Weltbilder der Antike'], L2]
    ],
    9: [
      ['1.1', 'Übergangslektüre', ['Fabeln (Phaedrus, Hygin)', 'Gellius, Noctes Atticae', 'Gesta Romanorum', 'Vespucci, Mundus novus', 'Vulgata: Joseph und seine Brüder', 'Biblische Gleichnisse']],
      ['1.2', 'Macht und Politik', ['Nepos, Biografie', 'Caesar, De bello Gallico', 'Sueton über Caesar', 'Römische Wertbegriffe', 'Caesars Propaganda']],
      ['1.3', 'Spott mit spitzer Feder', ['Martial, Epigramme', 'Elegisches Distichon, Metrik', 'Epigramm als Gattung', 'Menschliche Schwächen']],
      ['2.2', 'Formen- und Satzlehre', ['Historisches Präsens', 'Oratio obliqua', 'Komplexe Satzstrukturen', 'Latein – Deutsch']]
    ],
    10: [
      ['1', 'Texte und ihr kultureller Kontext', ['Cicero, Prozessreden', 'Plinius d. J., Briefe', 'Catull, Carmina', 'Ovid, Ars amatoria', 'Elegisches Distichon', 'Rhetorik', 'Rezeption: Einhard, Carmina Burana']],
      ['2', 'Sprachliche Basis', ['Lektürewortschatz', 'Mehrdeutige Wörter, Wendungen', 'Komplexe Satzperioden', 'Sprachvergleich']]
    ],
    11: [
      ['1', 'Texte und ihr kultureller Kontext', ['Sallust, Catilina', 'Cicero, Reden gegen Catilina', 'Ovid, Metamorphosen', 'Sokrates, Diogenes, Vorsokratiker', 'Epos, Hexameter', 'Späte Republik bis Kaiserzeit']],
      ['2', 'Sprachliche Basis', ['Lektürewortschatz', 'Lateinische Wendungen', 'Komplexe Satzperioden', 'Sprachvergleich']]
    ],
    12: [
      ['1', 'Texte und ihr kultureller Kontext', ['Cicero, De finibus', 'Seneca, Epistulae morales', 'Stoa und Epikureismus', 'Catull, satirische Gedichte', 'Petron, Cena Trimalchionis', 'Satire als Gesellschaftskritik'], GA],
      ['2', 'Sprachliche Basis', ['Philosophische Fachbegriffe', 'Vulgärlatein, Sprachwandel', 'Komplexe Satzperioden'], GA],
      ['1', 'Texte und ihr kultureller Kontext', ['Cicero, Lukrez, Seneca', 'Stoa und Epikureismus', 'Horaz, Ode 1,11', 'Petron, Cena Trimalchionis', 'Horaz’ Verssatire', 'Rezeption der Satire'], EA],
      ['2', 'Sprachliche Basis', ['Philosophische Fachbegriffe', 'Milieusprache bei Petron', 'Vulgärlatein, Sprachwandel', 'Komplexe Satzperioden'], EA]
    ]
  },

  Deutsch: {
    5: D({
      '1.1': ['Aufmerksames Zuhören', 'Rückmeldung zu Beiträgen', 'Hörtexte'], '1.2': ['Gedichtvortrag', 'Erzählen, Informieren, Argumentieren', 'Plakate präsentieren', 'Stimme, Mimik, Gestik'],
      '1.3': ['Gesprächsregeln', 'Konflikte im Gespräch lösen', 'Meinung begründen'], '1.4': ['Rollen übernehmen', 'Literarische Texte szenisch darstellen'],
      '2.1': ['Kinder- und Jugendbücher', 'Literarische und pragmatische Texte unterscheiden', 'Markieren, Kerngedanken', 'Lesetagebuch'],
      '2.2': ['Fabeln', 'Märchen', 'Gedichte', 'Spielszenen', 'Ganzschrift'], '2.3': ['Jugendzeitschriften, Lexika', 'Tabellen und Balkendiagramme'],
      '2.4': ['Bibliothek', 'Recherche mit Suchmaschinen', 'Hörtexte und Filme'], '3.1': ['Treffende Verben, anschauliche Adjektive', 'Wörtliche Rede', 'Textverarbeitung'],
      '3.2': ['Mindmap, Schreibplan', 'Erzählen aus einer Perspektive', 'Fabeln und Gedichte nachgestalten', 'Vorgänge beschreiben', 'Zustimmung und Ablehnung begründen'],
      '3.3': ['Überarbeitungskriterien', 'Textlupe, Schreibkonferenz'], '4.1': ['Mündlich und schriftlich', 'Sprachliche Bilder'],
      '4.2': ['Wortarten (lateinische Fachbegriffe)', 'Wortbildung: Präfix, Suffix, Stamm', 'Tempora', 'Satzglieder', 'Satzarten', 'Haupt- und Nebensatz', 'Synonyme, Antonyme, Wortfelder'],
      '4.3': ['Dehnung und Schärfung', 's-Laute', 'Groß- und Kleinschreibung', 'Silbentrennung', 'Komma bei Aufzählungen und Nebensätzen', 'Zeichensetzung bei wörtlicher Rede']
    }),
    6: D({
      '1.1': ['Radiobeiträge', 'Zentrale Aussagen wiedergeben'], '1.2': ['Sinnbetontes Vorlesen', 'Gedichtvortrag', 'Kurzreferat'],
      '1.3': ['Gesprächsregeln', 'Sachlich argumentieren'], '1.4': ['Rollenspiel', 'Körperhaltung, Modulation'],
      '2.1': ['Kinder- und Jugendbücher', 'Markieren, Clustern', 'Lesetagebuch'], '2.2': ['Antike Sagen', 'Erzählungen', 'Gedichte', 'Szenen', 'Ganzschrift', 'Perspektivwechsel, Fortsetzungen'],
      '2.3': ['Sachbücher, Lexika', 'Diagramme und Infografiken'], '2.4': ['Seriosität von Internetangeboten', 'Hörtexte und Filme'],
      '3.1': ['Personifikation', 'Aktiv und Passiv', 'Textverarbeitung'], '3.2': ['Schreibplan', 'Erzählen aus einer Perspektive', 'Sagen und Gedichte gestalten', 'Sachlich informieren', 'Meinung begründen'],
      '3.3': ['Überarbeitungsbogen', 'Ausdruck variieren'], '4.1': ['Dialekt und Standardsprache', 'Redewendungen'],
      '4.2': ['Wortarten', 'Aktiv und Passiv', 'Tempusformen', 'Satzglieder, Attribute', 'Satzgefüge', 'Ober- und Unterbegriffe'],
      '4.3': ['Dehnung und Schärfung', 'das/dass', 'Groß- und Kleinschreibung', 'Zeichensetzung bei wörtlicher Rede', 'Komma im Satzgefüge']
    }),
    7: D({
      '1.1': ['Hörbuchauszüge, Kurzvorträge', 'Begründete Meinung'], '1.2': ['Gedichtvortrag', 'Referat mit Visualisierung', 'Rhetorische Mittel'],
      '1.3': ['Diskussion', 'Konfliktlösung', 'Positionen zusammenfassen'], '1.4': ['Eigene Szenen entwickeln'],
      '2.1': ['Jugendliteratur und Sachbuch', 'Punktuelles und sequenzielles Lesen'], '2.2': ['Epische Kleinformen', 'Balladen', 'Kurze dramatische Texte', 'Mittelalter', 'Figuren, Raum, Zeit, Handlung', 'Ganzschrift'],
      '2.3': ['Sachbücher, Blogs, Erklärvideos', 'Diagramme', 'Adressat und Intention', 'Qualität von Argumenten'], '2.4': ['Internetrecherche', 'Ton-, Bild- und Schnitttechnik'],
      '3.1': ['Metaphern', 'Konjunktiv', 'Indirekte Rede', 'Paraphrase'], '3.2': ['Erzählen', 'Informierende Texte aus Materialien', 'Inhaltsangabe', 'Begründete Stellungnahme', 'Linearer Argumentationsaufbau', 'Sachlicher Brief'],
      '3.3': ['Kriterien für eigene Texte', 'Digital überarbeiten'], '4.1': ['Bedeutungswandel', 'Modusgebrauch'],
      '4.2': ['Verbmodi, Konjunktiv', 'Satzglieder und Satzgliedteile', 'Konditional, konsekutiv, konzessiv', 'Abstrakta'],
      '4.3': ['Getrennt- und Zusammenschreibung', 'Komma bei Infinitiv- und Partizipialgruppen', 'Rechtschreibstrategien']
    }),
    8: D({
      '1.1': ['Aussageabsicht erfassen', 'Stellungnahme zu Strittigem'], '1.2': ['Ausdrucksvolles Vorlesen', 'Referat mit Medien', 'Rhetorische Mittel'],
      '1.3': ['Kommunikationsmodell', 'Gruppendiskussion', 'Gegenargumente'], '1.4': ['Spielformen des Theaters', 'Szenisches Spiel im Dialekt'],
      '2.1': ['Diagonales und kursorisches Lesen', 'Analytisch-kritisches Lesen', 'Digitale Texte'], '2.2': ['Jugendliteratur', 'Epik, Drama, Lyrik', 'Fiktionalitätssignale', 'Medienwechsel', 'Zwei Ganzschriften'],
      '2.3': ['Nachricht, Kommentar, Glosse', 'Digitaler Journalismus', 'Argumentation und Intention'], '2.4': ['Zeitungsprojekt', 'Soziale Medien', 'Hörtexte und Filme', 'Grafische Literatur'],
      '3.1': ['Bildhafte Sprache', 'Infinitiv- und Partizipialkonstruktionen', 'Mitschrift', 'Indirekte Rede'], '3.2': ['Erzählen und Schildern', 'Informierende Texte aus Material', 'Linearer Argumentationstext', 'Leserbrief'],
      '3.3': ['Kommentarfunktion', 'Überarbeitungsplan'], '4.1': ['Dialekt und Jugendsprache', 'Kommunikationsmodell'],
      '4.2': ['Gliedsätze, Satzverknüpfungen', 'Tempus, Modus, Genus Verbi', 'Fremdwörter', 'Fachwortschatz'],
      '4.3': ['Zeichensetzung beim Zitieren', 'Fremdwörter schreiben', 'Fehleranalyse']
    }),
    9: D({
      '1.1': ['Gesprochene Texte zusammenfassen', 'Strittige Inhalte erörtern'], '1.2': ['Interpretierendes Vorlesen', 'Debatte', 'Präsentation, Referat'],
      '1.3': ['Gesprächssteuerung', 'Manipulation durch Sprache', 'Bewerbungsgespräch'], '1.4': ['Theaterformen'],
      '2.1': ['Selektives Lesen', 'Vertrauenswürdige Informationen'], '2.2': ['Kurzgeschichte', 'Erzähler, innerer Monolog', 'Drama: Konflikt, Figurenkonstellation', 'Lyrik: Gestaltungsmittel', 'Weltliteratur', 'Ganzschrift'],
      '2.3': ['Informierende und argumentierende Texte', 'Argumentationsweise', 'Texte vergleichen'], '2.4': ['Quellen bewerten', 'Filme, grafische Literatur', 'Mediale Gestaltungsmittel'],
      '3.1': ['Rhetorische Frage, Übertreibung', 'Zitieren mit Quellenangabe', 'Präsentationsprogramme'], '3.2': ['Journalistische Formen', 'Deutungshypothese', 'Erörterung', 'Kommentar', 'Lineare und antithetische Struktur'],
      '3.3': ['Textlogik prüfen'], '4.1': ['Sprachliche Klischees, Diskriminierung', 'Manipulation durch Sprache', 'Textkohärenz'],
      '4.2': ['Syntax und Textgrammatik', 'Redewiedergabe', 'Verdichtung, Abstraktion'], '4.3': ['Orthografische Besonderheiten', 'Fehleranalyse']
    }),
    10: D({
      '1.1': ['Strittige Inhalte erörtern'], '1.2': ['Debatte', 'Präsentation', 'Rhetorische Mittel'], '1.3': ['Sach- und Beziehungsebene', 'Unfaire Strategien', 'Sprachregister'],
      '1.4': ['Szenische Interpretation'], '2.1': ['Quellenkritik im Internet', 'Exzerpt'],
      '2.2': ['Novelle, Rahmen- und Binnenerzählung', 'Drama: Figurenkonzeption, Dialog', 'Sonett, Versformen', 'Aufklärung', 'Roman des 20./21. Jahrhunderts', 'Digitale Literatur'],
      '2.3': ['Thesen und Argumentation', 'Themengleiche Texte vergleichen'], '2.4': ['Filmanalyse', 'Grafische Literatur'],
      '3.1': ['Nominalstil', 'Ironie, Pointe', 'Exzerpieren, Zitieren'], '3.2': ['Gliederung', 'Begriffe definieren', 'Erörterung', 'Essay', 'Gegenargumente, Einräumung'],
      '3.3': ['Kohärenz', 'Prozess-Portfolio'], '4.1': ['Sprach- und Stilebenen', 'Fachsprache, Jugendsprache', 'Sprachwandel, Mehrsprachigkeit', 'Gelingende Kommunikation'],
      '4.2': ['Syntax', 'Nominalisierung', 'Nachschlagewerke'], '4.3': ['Rechtschreibstrategien', 'Fehleranalyse']
    }),
    11: D({
      '1.1': ['Aktives Zuhören', 'Rückmeldung im Diskurs'], '1.2': ['Interpretierender Vortrag', 'Referat mit Visualisierung'],
      '1.3': ['Gelingende und misslingende Kommunikation', 'Unfaire Strategien', 'Diskussion moderieren', 'Debatte'], '1.4': ['Szenische Interpretation'],
      '2.1': ['Quellenkritik', 'Exzerpt, Strukturskizze', 'Epochenkontext'], '2.2': ['Barock', 'Aufklärung', 'Sturm und Drang', 'Epik, Dramatik, Lyrik', 'Kanonfrage'],
      '2.3': ['Argumentationsanalyse', 'Narrative und Framing', 'Textvergleich'], '2.4': ['Filmanalyse', 'Hörtexte, Graphic Novel', 'Meinungsbildung in Medien'],
      '3.1': ['Exzerpt', 'Zitate, Quellenangaben'], '3.2': ['Interpretation literarischer Texte', 'Erörterung', 'Kommentar', 'Essay', 'Informierende Texte'],
      '3.3': ['Kohärenz und Kohäsion', 'Kollaborativ überarbeiten'], '4.1': ['Gegenwartssprache', 'Manipulation, Filterblasen, Fake News'],
      '4.2': ['Komplexe Satzbaupläne', 'Pro-Formen, Deiktika', 'Nominalisierung'], '4.3': ['Grammatik und Orthografie wiederholen', 'Sprachnormen']
    }),
    12: D({
      '1.1': ['Gesprächsformen', 'Diskursregeln'], '1.2': ['Referat, Präsentation, Rede', 'Rhetorische Überzeugungsmittel'],
      '1.3': ['Kommunikationstheorie', 'Digitale Öffentlichkeit', 'Prüfungsgespräch', 'Diskussion moderieren'], '1.4': ['Szenische Deutung'],
      '2.1': ['Deutungshypothesen', 'Gattungs- und Epochenwissen'], '2.2': ['Klassik', 'Romantik', 'Realismus', 'Naturalismus', 'Expressionismus', 'Exilliteratur', 'Nachkriegsliteratur', 'Literatur seit 1989'],
      '2.3': ['Literatur- und sprachtheoretische Texte', 'Framing, Agenda-Setting', 'Textvergleich'], '2.4': ['Mediengesellschaft', 'Audiovisuelle Texte'],
      '3.1': ['Wissenschaftliches Zitieren', 'Fachsprache'], '3.2': ['Analyse pragmatischer Texte', 'Interpretation', 'Erörterung', 'Kommentar', 'Essay', 'Gliederungsformen'],
      '3.3': ['Kollaborativ überarbeiten'], '4.1': ['Sprachvarietäten, Spracherwerb', 'Sprache, Denken, Wirklichkeit', 'Sprache und Macht', 'Persuasive Strategien'],
      '4.2': ['Konnotation, Denotation', 'Verdichtung, Abstrahierung'], '4.3': ['Sprachnormen', 'Digitale Korrekturwerkzeuge']
    })
  },
  Biologie: {
    8: [
      ['1', 'Erkenntnisse gewinnen – kommunizieren – bewerten', ['Naturwissenschaftlicher Erkenntnisweg', 'Untersuchungen planen und durchführen', 'Daten auswerten und interpretieren', 'Fehlerquellen', 'Modelle und ihre Grenzen', 'Tabellen, Diagramme, Schemazeichnungen']],
      ['2', 'Informationsaufnahme, -verarbeitung und Reaktion beim Menschen', ['Nervenzelle und Reiz-Reaktions-Kette', 'Auge, Lichtwahrnehmung, Sehfehler', 'Hörvorgang und Lärmschäden', 'Hormone: Schlüssel-Schloss-Prinzip', 'Blutzuckerregulation und Diabetes', 'Stressreaktion', 'Nerven- und Hormonsystem im Vergleich']],
      ['3', 'Fortpflanzung und Individualentwicklung des Menschen', ['Bedeutung der Sexualität', 'Pubertät und hormonelle Steuerung', 'Menstruationszyklus', 'Schwangerschaft und Vorsorge', 'Empfängnisregulation', 'Schutz vor sexuell übertragbaren Krankheiten']],
      ['4', 'Verhalten – genetisch bedingt und erlernt', ['Reize und innere Faktoren', 'Angeborenes Verhalten und Prägung', 'Kaspar-Hauser-Experimente', 'Klassische und operante Konditionierung', 'Lernfähigkeit des Menschen']],
      ['5', 'Suchtgefahren und Gesundheit', ['Genuss und Sucht', 'Stoffgebundene und nicht stoffgebundene Sucht', 'Entstehung von Sucht', 'Folgen für Betroffene', 'Lebenskompetenzen']],
      ['6', 'Ökosysteme unter dem Einfluss des Menschen', ['Sukzession', 'Wildnis und Kulturlandschaft', 'Eingriffe des Menschen', 'Renaturierung', 'Nachhaltigkeit und ökologischer Fußabdruck']],
    ],
    9: [
      ['1', 'Erkenntnisse gewinnen – kommunizieren – bewerten', ['Versuchsplanung und Hypothesen', 'Fehlerquellen und Dateninterpretation', 'Mikroskopieren', 'Modelle kritisch betrachten', 'Pro- und Kontra-Argumente abwägen']],
      ['2', 'Mikroorganismen in der Biotechnologie', ['Bau von Bakterien', 'Zweiteilung und Populationswachstum', 'Gärung und Zellatmung', 'Lebensmittelverderb und Konservierung', 'Nutzung in Lebensmitteln und Biogas']],
      ['3', 'Genetik und Gentechnik', ['Proteine und Proteinbiosynthese', 'DNA als Informationsspeicher', 'Vom Gen zum Merkmal', 'Replikation und Zellzyklus', 'Meiose und Neukombination', 'Genommutationen', 'Ethik der Gentechnik']],
      ['4', 'Evolution', ['Stammesgeschichte und Fossilien', 'Evolutionsfaktoren', 'Angepasstheit als Selektionsvorteil', 'Geographische Isolation und Artbildung']],
      ['5', 'Biodiversität bei Wirbellosen – Variabilität und Angepasstheit', ['Außenskelett der Insekten', 'Tracheen und offener Kreislauf', 'Metamorphose', 'Nervensystem und Sinne', 'Staatenbildung', 'Mundwerkzeuge']],
      ['6', 'Ökosystem Boden', ['Bodeneigenschaften und Bodenleben', 'Nahrungsnetz und Energiefluss', 'Humusbildung und Mineralisierung', 'Kohlenstoffkreislauf', 'Einflüsse des Menschen']],
    ],
    10: [
      ['1', 'Erkenntnisse gewinnen – kommunizieren – bewerten', ['Hypothesen prüfen', 'Daten auswerten', 'Modelle kritisch betrachten', 'Quellen wählen', 'Entscheidungen begründen']],
      ['2', 'Ökosystem Mensch', ['Symbionten und Krankheitserreger', 'Bakterien und Viren', 'Immunabwehr', 'Impfungen', 'Antibiotika und Resistenzen']],
      ['3', 'Stoff- und Energieumwandlung im Menschen', ['Makro- und Mikronährstoffe', 'Enzyme und Verdauung', 'Gasaustausch und Blutkreislauf', 'Glucoseabbau und ATP']],
      ['4', 'Vergangenheit und Zukunft des Menschen', ['Geschichte des Lebens', 'Einordnung des Homo sapiens', 'Fossilfunde', 'Kulturelle Evolution']],
    ],
    12: [
      ['1', 'Erkenntnisse gewinnen – kommunizieren – bewerten', ['Sachkompetenz', 'Erkenntnisgewinnung', 'Kommunikation', 'Bewertung', 'Fachübergreifende Bezüge'], GA],
      ['2', 'Genetik und Gentechnik', ['DNA und Proteinbiosynthese', 'Genregulation und Stammzellen', 'Replikation, PCR, Zellzyklus', 'Meiose, Mutationen, Gentechnik', 'Mendelsche Regeln', 'Humangenetik und DNA-Analytik'], GA],
      ['3', 'Evolution', ['Molekulare Homologien und Stammbäume', 'Systematik', 'Synthetische Evolutionstheorie', 'Artbildung', 'Koevolution'], GA],
      ['4', 'Verhaltensökologie – Evolution und Angepasstheit von Verhalten', ['Adaptiver Wert von Verhalten', 'Kosten-Nutzen-Analyse', 'Kooperation und Altruismus', 'Aggression und Rangordnung', 'Partnerwahl', 'Brutpflege'], GA],
    ],
    13: [
      ['1', 'Erkenntnisse gewinnen – kommunizieren – bewerten', ['Hypothesen und Modelle', 'Quellenkritik', 'Argumentation', 'Bewertung'], GA],
      ['2', 'Neuronale Informationsverarbeitung', ['Bau der Nervenzelle', 'Ruhe- und Aktionspotential', 'Erregungsleitung', 'Chemische Synapsen und Wirkstoffe', 'Depression und Monoamin-Hypothese'], GA],
      ['3', 'Stoffwechselphysiologie der Zelle', ['Photosynthese und Außenfaktoren', 'Lichtreaktionen und Calvin-Zyklus', 'Enzymregulation', 'Anaerober und aerober Glucoseabbau', 'Photosynthese und Zellatmung im Vergleich'], GA],
      ['4', 'Ökologie und Biodiversität', ['Biotop und Biozönose', 'Populationen und ökologische Nische', 'Ökosystemleistungen', 'Nachhaltige Nutzung', 'Globale Veränderungen der Biosphäre'], GA],
    ],
  },
  Chemie: {
    8: [
      ['1', 'Wie Chemiker denken und arbeiten', ['Gefahrstoffe und Laborsicherheit', 'Experimentieren und Protokollieren', 'Modelle hinterfragen', 'Fachsprache', 'Nachhaltigkeit'], NTG],
      ['2', 'Stoffe und ihre Eigenschaften', ['Kenneigenschaften', 'Teilchenmodell und Aggregatzustände', 'Reinstoffe und Gemische', 'Trennverfahren', 'Gasnachweise', 'Luft als Stoffgemisch'], NTG],
      ['3', 'Chemische Reaktion', ['Stoff- und Energieumsatz', 'Exotherm und endotherm', 'Katalyse', 'Massenerhaltung', 'Atommasse und Molekülformel', 'Verbrennung und CO₂'], NTG],
      ['4', 'Chemische Verbindungen und ihre Eigenschaften', ['Metallbindung', 'Moleküle und Ionengitter', 'Salze und Verhältnisformeln', 'Ionennachweise', 'Kern-Hülle-Modell'], NTG],
    ],
    9: [
      ['1', 'Wie Chemiker denken und arbeiten', ['Gefahrstoffe und Sicherheit', 'Experimente und Protokolle', 'Erkenntnisweg und Modelle', 'Nomenklatur und Formelsprache'], CHA],
      ['2', 'Stoffe und ihre Eigenschaften – vom Teilchenmodell', ['Teilchenmodell und Aggregatzustände', 'Kenneigenschaften von Reinstoffen', 'Stofftrennung', 'Gasnachweise'], CHA],
      ['3', 'Chemische Reaktion – zum Daltonschen Atommodell', ['Stoff- und Energieumsatz', 'Massenerhaltung', 'Molekülformeln und Stoffmengen', 'Exotherm und endotherm', 'Katalyse'], CHA],
      ['4', 'Chemische Verbindungen – zum Kern-Hülle-Modell', ['Grenzen des Dalton-Modells', 'Kern-Hülle-Modell', 'Metallbindung', 'Molekül- und Verhältnisformeln', 'Salzeigenschaften'], CHA],
      ['5', 'Atombau und gekürztes Periodensystem', ['Energiestufenmodell', 'Ionisierungsenergie', 'Valenzelektronen', 'Edelgaskonfiguration', 'Ionenladungen'], CHA],
      ['6', 'Donator-Akzeptor-Konzept – Elektronenübergänge', ['Elektrolyse von Salzlösungen', 'Salzbildung', 'Redoxreaktionen', 'Elektronenabgabe und -aufnahme', 'Batterien und Akkus'], CHA],
      ['1', 'Wie Chemiker denken und arbeiten', ['Gefahrstoffe und Laborregeln', 'Arbeitstechniken', 'Erkenntnisweg', 'Darstellungsformen'], NTG],
      ['2', 'Atombau und gekürztes Periodensystem', ['Energiestufenmodell', 'Ionisierungsenergie', 'Valenzelektronen und Ionenladung', 'Edelgasregel', 'Flammenfärbung'], NTG],
      ['3', 'Donator-Akzeptor-Konzept – Elektronenübergänge', ['Elektrolyse', 'Salzbildung', 'Oxidation als Elektronenabgabe', 'Batterien', 'Reversibilität'], NTG],
      ['4', 'Moleküle – vom Orbitalmodell zum EPA-Modell', ['Valenzstrichformeln', 'Orbitale und Elektronenpaarbindung', 'Mesomerie', 'Räumlicher Bau', 'Nomenklatur der Kohlenwasserstoffe'], NTG],
      ['5', 'Wechselwirkungskonzept – Anziehung zwischen Teilchen', ['Elektronegativität und Polarität', 'Funktionelle Gruppen', 'Zwischenmolekulare Kräfte', 'Erdölprodukte', 'Besonderheiten des Wassers'], NTG],
    ],
    10: [
      ['1', 'Wie Chemiker denken und arbeiten', ['Laborsicherheit', 'Lösungen definierter Konzentration', 'Erkenntnisweg', 'Reaktionsgleichungen', 'Bewertung'], CHA],
      ['2', 'Moleküle – vom Orbitalmodell zum EPA-Modell', ['Valenzstrichformeln', 'Elektronenpaarbindung', 'Mesomerie', 'Molekülgeometrie', 'Nomenklatur', 'Alkene, Alkine, E/Z-Isomerie'], CHA],
      ['3', 'Wechselwirkungskonzept – Anziehung zwischen Teilchen', ['Elektronegativität und Polarität', 'Funktionelle Gruppen', 'Zwischenmolekulare Kräfte', 'Erdölprodukte', 'Hydrophil, hydrophob, amphiphil'], CHA],
      ['4', 'Donator-Akzeptor-Konzept bei Protonenübergängen', ['pH-Wert und Indikatoren', 'Brønsted-Säuren und -Basen', 'Carbonsäuren', 'Neutralisation und Titration', 'Konzentrationen berechnen'], CHA],
      ['5', 'Redoxreaktionen in wässriger Lösung', ['Oxidationszahlen', 'Redoxteilgleichungen', 'Oxidation von Alkoholen', 'Aldehydnachweis', 'Brennstoffzellen'], CHA],
      ['6', 'Nukleophil-Elektrophil-Reaktionen', ['Glucose, Fructose, Saccharose', 'Keto-Enol-Tautomerie', 'Estersynthese und Hydrolyse', 'Peptidbindung'], CHA],
      ['1', 'Wie Chemiker denken und arbeiten', ['Laborsicherheit', 'Titration', 'Erkenntnisweg', 'Reaktionsgleichungen', 'Bewertung'], NTG],
      ['2', 'Donator-Akzeptor-Konzept bei Protonenübergängen', ['Säuren, Basen, Neutralisation', 'pH-Skala und Indikatoren', 'Brønsted-Konzept und Ampholyte', 'Säure-Base-Titration'], NTG],
      ['3', 'Redoxreaktionen', ['Metalle als Reduktionsmittel', 'Oxidationszahlen', 'Redoxgleichungen', 'Oxidation von Alkoholen', 'Batterien und Brennstoffzellen'], NTG],
      ['4', 'Nukleophil-Elektrophil-Reaktionen', ['Esterbildung und -hydrolyse', 'Fette', 'Seifen und Tenside', 'Waschmittel', 'Fruchtester'], NTG],
    ],
    11: [
      ['1', 'Wie Chemiker denken und arbeiten', ['Laborsicherheit', 'Analysemethoden', 'Hypothesen und Modelle', 'Datenauswertung', 'Bewerten'], NTG],
      ['2', 'Lebensmittelchemie', ['Nährstoffe und Zusatzstoffe', 'Nachweise und Chromatographie', 'Chiralität', 'Kohlenhydrate, Fette, Proteine', 'Enzyme', 'Nachhaltige Ernährung'], NTG],
      ['3', 'Pharmazie', ['Magensäure und Antazida', 'Schmerzmittel und Synthese', 'Wirkstoffe und Enzymhemmung', 'Darreichungsformen'], NTG],
    ],
    12: [
      ['1', 'Wie Chemikerinnen und Chemiker denken und arbeiten', ['Sachkompetenz', 'Erkenntnisgewinnung', 'Kommunikation', 'Bewertung'], GA],
      ['2', 'Atombau', ['Spektren', 'Quantenzahlen', 'Elektronenkonfiguration', 'Aufbau des Periodensystems'], GA],
      ['3', 'Analytik', ['Ionennachweise', 'Nachweis funktioneller Gruppen', 'Blindproben'], GA],
      ['4', 'Chemische Bindung', ['Bindungs- und Wechselwirkungstypen', 'Orbitale und Hybridisierung', 'Stoffklassen im Vergleich'], GA],
      ['5', 'Kohlenwasserstoffe – Energieträger und Reaktionspartner', ['Fossile und nachwachsende Rohstoffe', 'Reaktionsenthalpie', 'Radikalische Substitution', 'Halogenkohlenwasserstoffe'], GA],
      ['6', 'Reaktionsgeschwindigkeit', ['Mittlere und momentane Geschwindigkeit', 'Einflussfaktoren', 'Stoßtheorie', 'Katalyse'], GA],
      ['7', 'Chemisches Gleichgewicht', ['Dynamisches Gleichgewicht', 'Prinzip von Le Chatelier', 'Massenwirkungsgesetz', 'Haber-Bosch-Verfahren'], GA],
      ['8', 'Redoxgleichgewichte – Energetik und technische Anwendung', ['Galvanische Zellen', 'Spannungsreihe', 'Batterien und Brennstoffzellen', 'Entropie'], GA],
    ],
  },
  'Natur und Technik': {
    5: [
      ['1.1', 'Naturwissenschaftliches Arbeiten: Arbeitsmethoden', ['Labor- und Werkstattarbeit', 'Größen messen', 'Einfache Nachweisreaktionen', 'Erkenntnisweg und Hypothesen', 'Dokumentation und Präsentation']],
      ['1.2', 'Naturwissenschaftliches Arbeiten: Themenbereiche und Konzepte', ['Licht', 'Luft', 'Wasser', 'Boden und Gestein', 'Stoffe trennen', 'Teilchenmodell', 'Energieumwandlung']],
      ['2.1', 'Biologie: Erkenntnisse gewinnen – kommunizieren – bewerten', ['Erkenntnisweg', 'Mikroskopieren', 'Modelle und Protokolle', 'Fachsprache']],
      ['2.2', 'Biologie – die Wissenschaft von den Lebewesen', ['Kennzeichen von Lebewesen', 'Aufbau aus Zellen', 'Pflanzliche und tierische Zellen']],
      ['2.3', 'Der Mensch als Lebewesen', ['Sinnesorgane', 'Bewegungsapparat', 'Atmung und Stoffwechsel', 'Blutkreislauf', 'Pubertät', 'Suchtgefahren']],
      ['2.4', 'Samenpflanzen als Lebewesen', ['Blütenbau', 'Bestäubung', 'Blütendiagramme', 'Pflanzenfamilien']],
      ['2.5', 'Ökosystem Grünland', ['Pflanzen bestimmen', 'Umweltfaktoren', 'Bewirtschaftung', 'Lebensgemeinschaft']],
    ],
    6: [
      ['1.1', 'Biologie: Erkenntnisse gewinnen – kommunizieren – bewerten', ['Variablen und Kontrollversuch', 'Mikroskopie', 'Modelle', 'Darstellungsformen']],
      ['1.2', 'Samenpflanzen als Lebewesen', ['Früchte und Samen', 'Ausbreitung', 'Bionik', 'Keimung', 'Photosynthese und Zellatmung']],
      ['1.3', 'Biodiversität bei Wirbeltieren', ['Fortbewegung', 'Energiehaushalt', 'Fortpflanzung', 'Sinnesorgane']],
      ['1.4', 'Verwandtschaft der Wirbeltiere und Evolution', ['Wirbeltierklassen', 'Züchtung und Evolution', 'Heim- und Nutztiere']],
      ['1.5', 'Ökosystem Gewässer', ['Freilanduntersuchung', 'Artenkenntnis', 'Nahrungsnetz', 'Gewässerschutz']],
      ['2.1', 'Informatik: Informationsdarstellung mit Grafik-, Text- und Multimediadokumenten', ['Objekte, Attribute, Methoden', 'Vektor- und Pixelgrafik', 'Textdokumente', 'Software-Grundfunktionen']],
      ['2.2', 'Informatik: Projekt Multimediapräsentation', ['Gestaltungskriterien', 'Urheberrecht', 'Quellenangaben']],
      ['2.3', 'Informatik: Hierarchische Informationsstrukturen – Dateisystem', ['Baumstrukturen', 'Ordner und Dateien', 'Pfade']],
    ],
  },
  Englisch: {
    5: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Einfache Gespräche verstehen', 'Kurze Texte lesen', 'Über sich selbst sprechen', 'E-Mails, Postkarten, Dialoge', 'Einfache Sprachmittlung']],
      ['1.2', 'Wortschatz', ['Alltagswortschatz', 'Unregelmäßige Verben', 'Classroom phrases', 'Idioms und Collocations']],
      ['1.2', 'Grammatik', ['Nomen, Artikel, Pronomen', 'Fragen und Kurzantworten', 'Verneinung und Wortstellung', 'Present simple und progressive', 'Simple past', 'Hilfs- und Modalverben']],
      ['2', 'Interkulturelle Kompetenzen', ['Geographie von UK und USA', 'Alltagskultur in Großbritannien', 'Höfliches Verhalten', 'Englisch als Weltsprache']],
      ['3', 'Text- und Medienkompetenzen', ['Sach-, Dialog- und Erzähltexte', 'Reime und Lieder', 'Einfache Filmsequenzen']],
      ['5', 'Themengebiete', ['Leben im sozialen Umfeld', 'Britische Inseln und Nordamerika', 'London, Washington D.C., New York', 'Aktuelle Anlässe']],
    ],
    6: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Alltagsgespräche verstehen', 'Berichte lesen', 'Kurzvortrag mit Stichwortzettel', 'E-Mails und Bildergeschichten', 'Persönliche Briefe', 'Sprachmittlung im Alltag']],
      ['1.2', 'Wortschatz', ['Freizeit, Sport, Musik', 'Reisen, Wetter, Wegbeschreibung', 'Gesundheit', 'Phrasal verbs']],
      ['1.2', 'Grammatik', ['Present perfect simple', 'Past progressive', 'Futur: going to, will, timetable', 'Modalverben could, may, might, should', 'Konditionalsatz I', 'Relativsätze', 'Question tags']],
      ['2', 'Interkulturelle Kompetenzen', ['Geographie und Geschichte UK/USA', 'Alltagskultur Gleichaltriger', 'Höfliche Kommunikation']],
      ['3', 'Text- und Medienkompetenzen', ['Sach- und Erzähltexte', 'Websites von Sehenswürdigkeiten', 'Kreatives Schreiben und Rollenspiel', 'Filmsequenzen mit Untertiteln']],
      ['5', 'Themengebiete', ['Sport, Musik und Reisen', 'Stadt- und Landleben', 'Cornwall oder Lake District', 'Florida oder Rocky Mountains', 'Kelten und Römer in Britannien', 'Feste und Bräuche']],
    ],
    7: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Vlogs verstehen', 'Jugendartikel lesen', 'Short talk', 'Artikel und Interviews schreiben', 'Sprachmittlung im Alltag']],
      ['1.2', 'Wortschatz', ['Schule und Freizeit', 'Sport und Mediennutzung', 'Bräuche und Feste', 'Idioms und phrasal verbs']],
      ['1.2', 'Grammatik', ['Adverbien und Steigerung', 'Reflexive und reziproke Pronomen', 'one/ones und Possessivpronomen', 'Present perfect und past perfect', 'Konditionalsätze II und III', 'Zeitenfolge']],
      ['2', 'Interkulturelle Kompetenzen', ['Grundwissen UK und USA', 'Andere Lebensweisen verstehen', 'Angemessenes Verhalten']],
      ['3', 'Text- und Medienkompetenzen', ['Sachtexte und Jugendliteratur', 'Kreatives Schreiben, Tagebuch', 'Filmsequenzen', 'Kritischer Umgang mit Medien']],
      ['5', 'Themengebiete', ['Jugendliche in Nordamerika', 'Chancen und Risiken der Mediennutzung', 'Wales und Desert South-West', 'Englische und amerikanische Geschichte', 'Aktuelle Anlässe']],
    ],
    8: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Podcasts verstehen', 'Reportagen und Detektivgeschichten', 'Reiseblog und Zeitungsartikel', 'Stadtführung', 'Referate und Rollenspiele']],
      ['1.2', 'Wortschatz', ['Geschichte, Politik, Wirtschaft', 'Idioms', 'Verknüpfungswörter', 'Britisches und amerikanisches Englisch', 'Präsentationssprache']],
      ['1.2', 'Grammatik', ['Gerund als Subjekt', 'Infinitiv und Gerund nach Präpositionen', 'Verben mit zwei Objekten', 'Passiv in allen Zeiten', 'Artikelgebrauch', 'Stellung der Adverbien']],
      ['2', 'Interkulturelle Kompetenzen', ['UK, USA, Kanada', 'Umgang mit anderen Kulturen', 'Eigene Einstellungen reflektieren']],
      ['3', 'Text- und Medienkompetenzen', ['Sach- und fiktionale Texte', 'Filmsequenzen', 'Kreatives Weiterschreiben', 'Digitale Textformen']],
      ['5', 'Themengebiete', ['London als Großstadt', 'Politische Systeme von UK und USA', 'Kanada und Inuit', 'Entstehung der USA', 'Besiedlung des Westens']],
    ],
    9: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Podcasts verstehen', 'Reiseberichte und Blogs lesen', 'Leserbrief', 'Bewerbungsschreiben', 'Präsentationen', 'Sprachmittlung']],
      ['1.2', 'Wortschatz', ['Konsum und Medien', 'Nachhaltigkeit', 'Bildungssysteme', 'Berufswelt und Bewerbung', 'Meinungsäußerung']],
      ['1.2', 'Grammatik', ['Nicht notwendige Relativsätze', 'would und used to', 'Zukunftsformen und Zeitenfolge', 'Partizipialkonstruktionen', 'Gerund und Infinitiv', 'Emphase mit do', 'Indirekte Rede']],
      ['2', 'Interkulturelle Kompetenzen', ['Englischsprachige Länder', 'Bildungssysteme UK und USA', 'Werte im Vergleich']],
      ['3', 'Text- und Medienkompetenzen', ['Informierende und argumentative Texte', 'Literarische Kurzformen', 'Wirkung von Filmsequenzen', 'Stellungnahme verfassen']],
      ['5', 'Themengebiete', ['Australien und Neuseeland', 'Schule in UK und USA', 'Praktikum, Ferienjob, Auslandsaufenthalt', 'Konsum- und Medienverhalten', 'Kurze literarische Texte']],
    ],
    10: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Reden verstehen', 'Komplexe Texte lesen', 'Diskutieren und Stellung nehmen', 'Argumentative Texte und Zusammenfassungen', 'Filmrezension', 'Sprachmittlung']],
      ['1.2', 'Wortschatz', ['Phrasal verbs und false friends', 'Themenwortschatz', 'Argumentationsmittel', 'Sprachvarietäten']],
      ['1.2', 'Grammatik', ['Zeitenfolge', 'Passiv', 'Konditionalsätze', 'Indirekte Rede', 'Adjektiv und Adverb']],
      ['2', 'Interkulturelle Kompetenzen', ['Landeskundliches Grundwissen', 'Stereotype hinterfragen', 'Perspektivwechsel']],
      ['3', 'Text- und Medienkompetenzen', ['Informierende und erzählende Texte', 'Literarische Grundbegriffe', 'Filmanalyse', 'Seriöse Nachrichten erkennen']],
      ['5', 'Themengebiete', ['Schottland', 'African Americans in den USA', 'Jugendkultur', 'Musik und Gesellschaft', 'Literatur und Film']],
    ],
    11: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Hör-/Hörsehverstehen', 'Leseverstehen', 'Sprechen', 'Schreiben', 'Sprachmittlung']],
      ['1.2', 'Verfügen über sprachliche Mittel', ['Wortschatz Politik und digitale Welt', 'Partizipien', 'Aspekt', 'Relativsätze', 'Emphase']],
      ['2', 'Interkulturelle Kompetenzen', ['UK, USA, Commonwealth', 'Perspektivwechsel', 'Kulturelle Prägung von Nachrichten', 'Leben in der Großstadt']],
      ['3', 'Text- und Medienkompetenzen', ['Sach- und literarische Texte analysieren', 'Filmanalyse', 'Seriöse Nachrichten erkennen', 'Argumentative und kreative Texte']],
      ['5', 'Themengebiete', ['Kolonialisierung und Postkolonialismus', 'London oder New York', 'Industrialisierung, Globalisierung, Digitalisierung', 'Englisch als Weltsprache', 'Zukunftsvisionen']],
    ],
    12: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Hör- und Hörsehtexte', 'Komplexe Lesetexte', 'Diskussionen führen', 'Präsentationen', 'Kommentar und Argumentation', 'Sprachmittlung'], GA],
      ['1.2', 'Verfügen über sprachliche Mittel', ['Differenzierter Wortschatz', 'Sichere Grammatik', 'Orthographie und Zeichensetzung'], GA],
      ['2', 'Interkulturelle Kompetenzen', ['Orientierungswissen Zielkulturen', 'Vorurteile reflektieren', 'Missverständnisse klären'], GA],
      ['3', 'Text- und Medienkompetenzen', ['Literarische und Sachtexte analysieren', 'Mediale Gestaltungsmittel', 'Kreatives Schreiben'], GA],
      ['5', 'Themengebiete', ['Irland: Troubles und Brexit', 'Anglophones Afrika oder Asien', 'Kulturleben in UK und USA', 'Wissenschaft, Technik, Umwelt', 'Multikulturelle Gesellschaften', 'Politik und internationale Beziehungen', 'Medien und Informationsgesellschaft', 'Literatur, Drama, Film'], GA],
    ],
  },
  Französisch: {
    6: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Begrüßen und vorstellen', 'Steckbrief und Einladung', 'E-Mails und Kurznachrichten', 'Einfache Fragen beantworten', 'Sprachmittlung im Alltag'], F2],
      ['1.2', 'Wortschatz', ['Familie und Alltag', 'Hobbys', 'Schule und Arbeitsanweisungen', 'Zahlen, Daten, Uhrzeiten', 'Mengen und Wünsche'], F2],
      ['1.2', 'Grammatik', ['Artikel und Plural', 'Possessiv- und Demonstrativbegleiter', 'Verneinung ne … pas', 'Personal- und Objektpronomen', 'Fragebildung', 'Präsens und futur composé', 'Imperativ'], F2],
      ['2', 'Interkulturelle Kompetenzen', ['Geographie Frankreichs', 'Alltag in Deutschland und Frankreich', 'Höfliche Umgangsformen'], F2],
      ['5', 'Themengebiete', ['Feste und Traditionen', 'Persönliches Umfeld', 'Reisen und Wegbeschreibung', 'Französische Kunst und Kultur'], F2],
    ],
    7: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Wetterbericht verstehen', 'Telefonate und Sprachnachrichten', 'Dialoge und E-Mails', 'Wegbeschreibungen und Rezepte'], F2],
      ['1.2', 'Wortschatz', ['Alltagsbedürfnisse', 'Interessen', 'Zahlen bis eine Million', 'Bildbeschreibung', 'Vorlieben und Vorschläge'], F2],
      ['1.2', 'Grammatik', ['Relativsätze mit qui, que, où', 'Teilungsartikel und en', 'Komparativ und Superlativ', 'Indirekte Rede', 'Passé composé und imparfait', 'Verben auf -ir', 'Reflexive Verben'], F2],
      ['2', 'Interkulturelle Kompetenzen', ['Bretagne', 'Jugendliche in Deutschland und Frankreich', 'Schulalltag in Frankreich'], F2],
      ['5', 'Themengebiete', ['Paris, Lyon, Nantes, Bretagne', 'Reisen und Austausch', 'Gallier und Römer: Astérix', 'Bandes dessinées'], F2],
    ],
    8: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Podcasts', 'Durchsagen verstehen', 'Briefe und E-Mails', 'Chatbeiträge und Posts', 'Kurzvortrag', 'Sprachmittlung'], F2],
      ['1.2', 'Wortschatz', ['Alltag und Routine', 'Musik und Freunde', 'Meinung äußern', 'Zahlen und Brüche', 'Wortbildung'], F2],
      ['1.2', 'Grammatik', ['Präpositionen bei Ländernamen', 'Adverbien auf -ment', 'Verneinungen wie personne ne', 'Mise en relief', 'Inversionsfrage und lequel', 'Plus-que-parfait', 'Reflexive Verben im passé composé'], F2],
      ['2', 'Interkulturelle Kompetenzen', ['Regionen Frankreichs', 'Großstädte und Migration', 'Québec und Bayern'], F2],
      ['5', 'Themengebiete', ['Alltag Jugendlicher', 'Französisches Schulsystem', 'Internationaler Austausch', 'Rittertum und Burg', 'Standardsprache und Umgangssprache'], F2],
    ],
    9: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Streitgespräche und Nachrichten', 'Auszüge aus Jugendromanen', 'Kurzpräsentation', 'Blogbeitrag und E-Mail', 'Sprachmittlung'], F2],
      ['1.2', 'Wortschatz', ['Kommunikationssituationen', 'Grammatische Fachbegriffe', 'Umschreibungsstrategien', 'Diagramme beschreiben'], F2],
      ['1.2', 'Grammatik', ['Conditionnel présent und passé', 'Bedingungssätze I bis III', 'Pronomen y und en', 'Futur simple', 'Unregelmäßige Verben'], F2],
      ['2', 'Interkulturelle Kompetenzen', ['Jugendliche in Frankreich und der Schweiz', 'Deutsch-französische Freundschaft', 'Kulturelle Unterschiede'], F2],
      ['5', 'Themengebiete', ['Konflikte in Freundeskreis, Schule, Familie', 'Traumberuf und Praktikum', 'Grand Est und Schweiz', 'Sonnenkönig und Versailles'], F2],
    ],
    10: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Hör- und Hörsehtexte', 'Presse und Jugendliteratur', 'Präsentation und Diskussion', 'Bewerbungsgespräch', 'Leserbrief und Rezension', 'Sprachmittlung']],
      ['1.2', 'Wortschatz', ['Meinungen und Gefühle', 'Argumentieren', 'Text- und Medienbegriffe']],
      ['1.2', 'Grammatik', ['Subjonctif présent', 'Indirekte Rede in der Vergangenheit', 'Indirekte Frage', 'Passiv', 'Passé simple rezeptiv', 'Angleichung des participe passé', 'ne … ni … ni']],
      ['2', 'Interkulturelle Kompetenzen', ['Jugendliche in Frankreich und im Maghreb', 'Deutsch-französische Freundschaft', 'Perspektivwechsel']],
      ['5', 'Themengebiete', ['14 juillet', 'Leben in Nice und Grenoble', 'Ein Land des Maghreb', 'Élysée-Vertrag und Aachener Vertrag', 'Französischer Film', 'Jugendroman und Comic']],
    ],
    11: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Präsentation zu Gesellschaftsthemen', 'Bewerbung und Lebenslauf', 'Diskussion', 'Commentaire personnel', 'Sprachmittlung']],
      ['1.2', 'Wortschatz', ['Gesellschaft und Zukunft', 'Bewerbung', 'Argumentation', 'Digitale Medien', 'Wortschatz zur Textarbeit']],
      ['1.2', 'Grammatik', ['sans, après, avant de + Infinitiv', 'Gérondif', 'Zwei Objektpronomen, en und y', 'Demonstrativpronomen', 'ce qui, ce que', 'dont und lequel']],
      ['2', 'Interkulturelle Kompetenzen', ['Frankophone Länder', 'Frankreich und Belgien im Vergleich', 'Europäischer Gedanke']],
      ['5', 'Themengebiete', ['Junge Menschen in der Gesellschaft', 'Berufliche Orientierung', 'Belgien und Umwelt', 'Deutsch-französische Beziehungen und EU', 'Digitalisierung und Manipulation', 'Kulturelle Identität Frankreichs']],
    ],
  },
  Spanisch: {
    8: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Durchsagen und Sprachnachrichten', 'Anzeigen und E-Mails lesen', 'Alltagsgespräche und Einkauf', 'Charla de un minuto', 'Tagebuch, Blog, Postkarte'], S3],
      ['1.2', 'Wortschatz', ['Uhrzeit und Datum', 'Alltag und Einkauf', 'Schule', 'Familie und Wohnen', 'Freizeit und Vorlieben'], S3],
      ['1.2', 'Grammatik', ['Präsens regelmäßig und unregelmäßig', 'Pretérito indefinido', 'ir a + Infinitiv', 'estar + gerundio', 'Objekt- und Reflexivpronomen', 'Komparativ und Superlativ', 'Bejahter Imperativ', 'ser, estar, hay'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Spanischer Sprachraum', 'Alltag in Deutschland und Spanien', 'Tutear und usted'], S3],
      ['5', 'Themengebiete', ['Soziales Umfeld', 'Persönlichkeiten aus Kunst und Sport', 'Spanischsprachige Länder und Hauptstädte', 'Autonome Regionen und Mehrsprachigkeit'], S3],
    ],
    9: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Gespräche im Alltag', 'Über Erlebnisse berichten', 'Präsentationen', 'Blogeinträge', 'E-Mail mit Ratschlägen', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Bildbeschreibung', 'Verpflichtungen ausdrücken', 'Umgangssprache', 'Hispanoamerikanische Varianten'], S3],
      ['1.2', 'Grammatik', ['Imperfecto', 'Pretérito perfecto', 'Pluscuamperfecto', 'Presente de subjuntivo', 'Realer Bedingungssatz', 'donde und lo que', 'Possessivpronomen'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Spanienbild und Klischees', 'Lebensweise im Vergleich', 'Vielfalt des Sprachraums'], S3],
      ['5', 'Themengebiete', ['Lebenswelt Jugendlicher', 'Balearen', 'Galicien', 'Argentinien', 'Medienverhalten'], S3],
    ],
    10: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews, Werbespots, canciones', 'Sach- und erste literarische Texte', 'Diskussion und Präsentation', 'Reisebericht, Artikel, Anfrage', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Operatoren für Text- und Bildanalyse', 'Statistiken beschreiben', 'Meinungsäußerung', 'Enlaces'], S3],
      ['1.2', 'Grammatik', ['Relativsätze mit el que, quien', 'Pasiva refleja', 'Infinitivkonstruktionen', 'Superlativ auf -ísimo', 'Futuro simple', 'Subjuntivo in Temporal- und Konzessivsätzen', 'Condicional', 'Irreale Bedingungssätze'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Spanien und Hispanoamerika', 'Fremde Wertesysteme', 'Stereotype'], S3],
      ['5', 'Themengebiete', ['Präkolumbische Kulturen und Conquista', 'Andalusien', 'Peru', 'Medienlandschaft', 'Jugendroman, Lieder, Kurzfilm'], S3],
    ],
    11: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Nachrichten und Reportagen', 'Zeitungs- und Sachtexte', 'Diskussion und Vorstellungsgespräch', 'Digitale Präsentation', 'Texto de opinión', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Verbalperiphrasen', 'Konnektoren und Redemittel', 'Beruf und Studium'], S3],
      ['1.2', 'Grammatik', ['cuyo und el cual', 'Subjuntivo im Relativsatz', 'Voz pasiva', 'Zeitenfolge mit subjuntivo', 'Indirekte Rede'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Geschichte und Kultur', 'Werte aus fremder Perspektive'], S3],
      ['5', 'Themengebiete', ['Spanien vom Bürgerkrieg bis heute', 'Leben in Großstädten', 'Mexiko, USA und Migration', 'Spanglish', 'Film, Musik und Kunst'], S3],
    ],
  },
  Italienisch: {
    8: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Durchsagen und Audioguides', 'Plakate und Webseiten lesen', 'Kurzvortrag und Alltagsgespräch', 'Persönliche Mitteilungen', 'Dolmetschen im Alltag'], S3],
      ['1.2', 'Wortschatz', ['Zahlen, Daten, Uhrzeit', 'Farben und Mengen', 'tutto und molto', 'Wortbildung mit -ino und -issimo'], S3],
      ['1.2', 'Grammatik', ['Artikel, Substantive, Pronomen', 'Präpositionen und Possessivbegleiter', 'Imperativ und Fragesätze', 'Präsens und unregelmäßige Verben', 'Passato prossimo', 'Condizionale semplice', 'Relativsätze mit che', 'Si impersonale'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Alltag und Feste im Vergleich', 'Gruß- und Anredeformen', 'Missverständnisse'], S3],
      ['5', 'Themengebiete', ['Feste im Jahreslauf', 'Familie und Alltag', 'Schule', 'Geographie Italiens', 'Rom und die Toskana', 'Persönlichkeiten und Musik'], S3],
    ],
    9: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Hörtexte', 'Speisekarten und Sachtexte', 'Gespräche und Kurzvorträge', 'Briefe und Nachrichten', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Alltagssituationen', 'Meinung äußern', 'Sätze verknüpfen', 'Wortbildung'], S3],
      ['1.2', 'Grammatik', ['Steigerung und Vergleich', 'Adverbien', 'Relativsätze mit cui, quello che', 'Pronomen ci und ne', 'Congiuntivo nach Meinungsverben', 'Futuro semplice', 'Passato prossimo und imperfetto', 'Indirekte Rede'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Gemeinsamkeiten und Klischees', 'Höflichkeit', 'Digitale Kommunikation'], S3],
      ['5', 'Themengebiete', ['Feste und Sagre', 'Stadt- und Landleben', 'Reisen', 'Regionen Italiens', 'Made in Italy', 'Festival di Sanremo'], S3],
    ],
    10: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Gespräche und Vorträge', 'Berichte und kreative Texte', 'Formeller Brief', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Wortbildung', 'Umschreibungsstrategien', 'Wörterbucharbeit'], S3],
      ['1.2', 'Grammatik', ['Passiv mit essere und venire', 'Doppelpronomen', 'Condizionale und congiuntivo', 'Bedingungssätze', 'Trapassato prossimo', 'Indirekte Rede und Zeitenfolge'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Andere Verhaltensweisen verstehen', 'Vorurteile reflektieren', 'Begegnungen in Tourismus und Ehrenamt'], S3],
      ['5', 'Themengebiete', ['Karneval in Venedig, Palio di Siena', 'Nord-Süd-Gefälle', 'Natur und Erdbeben', 'Medici und Florenz', 'Dialekte'], S3],
    ],
    11: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Blogeintrag und Erfahrungsbericht', 'Bewerbung um ein Praktikum', 'Vortrag und Debatte', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Arbeitswelt', 'Digitale Medien', 'Wirtschaft und Werbung', 'Kultur und Kunst'], S3],
      ['1.2', 'Grammatik', ['Passato remoto', 'Futuro anteriore', 'Passiv mit andare', 'Relativsätze mit il cui', 'Gerundio und Partizipien', 'lasciare/fare + Infinitiv'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Fremde Verhaltensmuster', 'Missverständnisse klären', 'eTwinning'], S3],
      ['5', 'Themengebiete', ['Made in Italy', 'Arbeit und Studium', 'Leben in Großstädten', 'Risorgimento', 'Commedia dell’Arte', 'Film, Musik, Kunst'], S3],
    ],
  },
  Russisch: {
    8: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Alltagsdialoge verstehen', 'Speisekarten und Stadtpläne', 'Über Vorlieben sprechen', 'Steckbrief und Postkarte', 'Messenger-Nachrichten'], S3],
      ['1.2', 'Wortschatz', ['Schule und Freizeit', 'Familie und Wohnen', 'Einkaufen und Verkehrsmittel', 'Essen und Trinken', 'Internationalismen'], S3],
      ['1.2', 'Grammatik', ['Kyrillische Schrift', 'Substantive I. und II. Deklination', 'Personal-, Possessiv-, Demonstrativpronomen', 'кто, что, какой', 'Präsens e- und i-Konjugation', 'Verben der Bewegung', 'есть/нет mit Genitiv'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Anrede mit Vatersnamen', 'Kurzformen der Vornamen', 'Höflichkeit', 'Bräuche'], S3],
      ['5', 'Themengebiete', ['Soziales Umfeld', 'Essen und Alltag', 'Geographie Russlands', 'Neujahr und Ostern', 'Persönlichkeiten'], S3],
    ],
    9: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Dialoge und Umfragen', 'Briefe und Blogs', 'Gespräche und Präsentationen', 'E-Mail, Tagebuch, Interview', 'Dolmetschen'], S3],
      ['1.2', 'Wortschatz', ['Familie und Alltag', 'Schule', 'Reisen und Verkehr', 'Freizeit, Sport, Musik', 'Gesundheit und Wetter'], S3],
      ['1.2', 'Grammatik', ['Plural und Deklination', 'Adjektive: Plural und Steigerung', 'Zahlen, Datum, Ordnungszahlen', 'Relativpronomen', 'Reflexive Verben und Aspekt', 'Präteritum und Imperativ', 'Futur'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Höflichkeit im Alltag', 'Gedenken an den Zweiten Weltkrieg', 'Glückwünsche'], S3],
      ['5', 'Themengebiete', ['Familie, Alltag, Schule', 'Feste und Bräuche', 'Geographie Russlands', 'Persönlichkeiten aus Kultur und Geschichte'], S3],
    ],
    10: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Dialoge und Interviews', 'Kurztexte', 'Kurzreferat', 'Blog und E-Mail', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Restaurant und Rezepte', 'Bildungssystem', 'Geographie und Klima', 'Feste'], S3],
      ['1.2', 'Grammatik', ['Substantive auf -ия/-ие', 'i-Deklination', 'Zahlen ab 200', 'Doppelte Verneinung', 'Perfektives Futur', 'Konjunktiv und Konditionalsätze', 'Finalsätze mit чтобы', 'Indirekte Fragen'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Geschichte und Zarenreich', 'Stereotype', 'Rolle der Kirche'], S3],
      ['5', 'Themengebiete', ['Restaurantbesuch', 'Bildungssystem Russlands', 'Geographie und Klima', 'Kultur und Geschichte'], S3],
    ],
    11: [
      ['1.1', 'Kommunikative Fertigkeiten', ['Interviews und Vlogs', 'Textzusammenfassung', 'Bildbeschreibung', 'Kurzpräsentation', 'Sprachmittlung'], S3],
      ['1.2', 'Wortschatz', ['Studium und Beruf', 'Digitale Medien', 'Landeskunde', 'Wortfamilien'], S3],
      ['1.2', 'Grammatik', ['Substantive auf -анин', 'Familien- und Vatersnamen', 'Genitiv des Vergleichs', 'Präfigierte Verben der Bewegung', 'Konditionalsätze', 'Konzessivsätze mit хотя', 'Passivkonstruktionen'], S3],
      ['2', 'Interkulturelle Kompetenzen', ['Missverständnisse', 'Andere Werte respektieren', 'Diminutive'], S3],
      ['5', 'Themengebiete', ['Jugend und Alltag', 'Digitalisierung', 'Geschichte im 18. und 19. Jahrhundert', 'Film, Musik, Kunst', 'Erzählungen und Jugendroman'], S3],
    ],
  },
  Griechisch: {
    8: [
      ['1', 'Texte', ['Kreta und Peloponnes', 'Frühzeit und archaische Zeit', 'Frauen und Sklaven', 'Spartanische Erziehung', 'Götter, Kult und Mythen', 'Olympia, Delphi, Epidauros'], G3],
      ['2', 'Sprachliche Basis', ['Griechisches Alphabet', 'Grundwortschatz', 'Präsens, Imperfekt, Futur, Aorist', 'Nomina und Pronomina', 'AcI und Partizip', 'Negationen οὐ und μή'], G3],
      ['3', 'Kultureller Kontext', ['Kreta als Wiege Europas', 'Mykene', 'Heiligtum von Olympia', 'Sparta und Phalanx', 'Götter und Helden'], G3],
      ['4', 'Methodik', ['Übersetzungstechniken', 'Texterschließung', 'Lernstrategien'], G3],
    ],
    9: [
      ['1', 'Texte', ['Athenische Demokratie unter Perikles', 'Perserkriege', 'Vorsokratiker und Sophisten', 'Sokrates und Platon'], G3],
      ['2', 'Sprachliche Basis', ['Wortfamilien und Fremdwörter', 'Verba contracta', 'Wurzelaorist', 'Konjunktiv und Optativ', 'Verba liquida', 'Kasusfunktionen', 'Final- und Konditionalsätze'], G3],
      ['3', 'Kultureller Kontext', ['Polis und Demokratie', 'Akropolis und Agora', 'Säulenordnungen', 'Griechische Philosophie'], G3],
      ['4', 'Methodik', ['Übersetzungstechniken', 'Erschließungsfragen', 'Kreative Textrezeption'], G3],
    ],
    10: [
      ['1', 'Spracherwerb', ['Makedonien und Hellenismus', 'Präsensreduplikation', 'Verben auf -νυμι', 'Verbaladjektive auf -τός und -τέος', 'Relativsätze'], G3],
      ['2', 'Übergangslektüre', ['Adaptierte Prosa, z. B. Lukian', 'Textgliederung und Paraphrase'], G3],
      ['3', 'Texte und ihr kultureller Kontext', ['Platon und Xenophon', 'Sokrates', 'Sokratische Wende', 'Dialektik und Elenktik'], G3],
      ['4', 'Sprachliche Basis (Lektürephase)', ['Lektürewortschatz', 'Infinitiv- und Partizipialkonstruktionen', 'Ellipse im Dialog'], G3],
    ],
    11: [
      ['1', 'Texte und ihr kultureller Kontext', ['Herodot, Historien', 'Homer, Odyssee', 'Athen und die Demokratie', 'Lysias, Rede', 'Drama'], G3],
      ['2', 'Sprachliche Basis', ['Autorenwortschatz', 'Historisches Präsens', 'Relativsätze mit Attraktion', 'Ionischer Dialekt, epische Sprache'], G3],
      ['3', 'Methodik', ['Übersetzungsstrategien', 'Kursorisches Lesen', 'Zweisprachige Ausgaben'], G3],
    ],
  },
  Geographie: {
    5: [
      ['1', 'Geographische Arbeitstechniken', ['Karten und Atlas', 'Globus und Geomedien', 'Gradnetz und Maßstab', 'Kartentypen', 'Messungen und Diagramme', 'Kartenskizzen']],
      ['2', 'Planet Erde', ['Sonnensystem und Erdaufbau', 'Einzigartigkeit der Erde', 'Schutz der Lebensgrundlagen', 'Orientierung mit Geomedien']],
      ['3', 'Naturräume in Bayern und Deutschland', ['Naturräumliche Gliederung', 'Alpen und Alpenvorland', 'Mittelgebirge', 'Küste und Wattenmeer', 'Oberflächenformen', 'Naturgefahren']],
      ['4', 'Ländliche Räume in Bayern und Deutschland', ['Merkmale ländlicher Räume', 'Einflussfaktoren der Landwirtschaft', 'Konventionelle und ökologische Landwirtschaft', 'Weg der Lebensmittel']],
      ['5', 'Städtische Räume in Bayern und Deutschland', ['Stadt-Umland-Beziehungen', 'Verdichtungsräume', 'Funktionen der Stadt', 'Suburbanisierung', 'Nachhaltiger Stadtumbau']],
    ],
    7: [
      ['1', 'Geographische Arbeitstechniken', ['Karten und Skizzen', 'Bild- und Satellitenbilder', 'Diagramme und Statistiken', 'Digitale Geomedien']],
      ['2', 'Einheit und Vielfalt in Europa', ['Orientierung in Europa', 'Idee und Aufgaben der EU', 'Sprachen und Minderheiten', 'Migration']],
      ['3', 'Naturgeographie Europas im Überblick', ['Naturräumliche Gliederung', 'Klima- und Vegetationszonen', 'Plattengrenzen, Vulkane, Erdbeben', 'Klimawandel']],
      ['4', 'Ländliche Räume Europas', ['Intensive und extensive Landnutzung', 'Nachhaltige Lebensmittel', 'Periphere Räume und Disparitäten', 'Arbeitsmigration']],
      ['5', 'Metropolen und Verdichtungsräume in Europa', ['Merkmale und Probleme von Metropolen', 'Standortfaktoren', 'Infrastrukturprojekte', 'Energieverbund']],
      ['6', 'Meere und Küsten Europas', ['Europäische Meere', 'Küstenformen', 'Fischerei und Aquakultur', 'Seehäfen', 'Küstentourismus', 'Meeresschutz und Plastikmüll']],
    ],
    10: [
      ['1', 'Geographische Arbeitstechniken', ['Klima- und Vegetationskarten', 'Klimadiagramme', 'Blockbilder und Kausalprofile', 'Stadtmodelle']],
      ['2', 'Leben in der Einen Welt', ['Entwicklungsindikatoren', 'Ungleiche Entwicklung', 'Entwicklungszusammenarbeit', 'Fluchtursachen']],
      ['3', 'Klima- und Vegetationszonen der Tropen und ariden Subtropen', ['Strahlung und Temperatur', 'Passatzirkulation', 'Regenzeiten', 'Regenwald, Savanne, Wüste', 'Nutzung und Verwundbarkeit']],
      ['4', 'Klima im Wandel', ['Anthropogener Treibhauseffekt', 'Klimaszenarien', 'Extremwetter', 'Anpassung und Klimaschutz']],
      ['5', 'Nordafrika, Naher und Mittlerer Osten', ['Naturräume', 'Orientalische Stadt', 'Wassermangel', 'Nomadismus und Oasen', 'Erdöl und Erdgas']],
      ['6', 'Afrika südlich der Sahara', ['Desertifikation im Sahel', 'Entwicklungshemmnisse', 'Direktinvestitionen', 'Nachhaltige Entwicklung']],
      ['7', 'Mittel- und Südamerika, Karibik', ['Verwundbarkeit der Karibik', 'Abholzung des Amazonas', 'Megastädte und Marginalsiedlungen', 'Plantagen und Tourismus', 'Höhenstufen']],
    ],
    11: [
      ['1', 'Geographische Arbeitstechniken', ['Karten und Diagramme', 'Quellenkritik', 'Geographische Modelle', 'Mediale Raumdarstellungen']],
      ['2', 'Einblick in die Globalisierung', ['Globalisierung im Alltag', 'Akteure', 'Nachhaltigkeitsdimensionen', 'Produktweg von Jeans oder Smartphone']],
      ['3', 'Die USA im Spannungsfeld globaler Einflüsse', ['Naturräume und Klima', 'Agrobusiness und Industrie', 'IT-Branche', 'Nordamerikanische Stadt', 'Migration und Disparitäten']],
      ['4', 'Russland – Raum als Potenzial und Herausforderung', ['Naturausstattung', 'Kontinentalklima', 'Erschließung peripherer Räume', 'Geopolitik']],
      ['5', 'China – Global Player', ['Naturräumliches Potenzial', 'Bevölkerungspolitik', 'Weltwirtschaft', 'Umweltprobleme', 'Wasserbauprojekte']],
      ['6', 'Australien und Ozeanien', ['Extremereignisse', 'Sensible Ökosysteme', 'Indigene Bevölkerung', 'Ferntourismus']],
    ],
    12: [
      ['1', 'Geographische Arbeitstechniken', ['Karten und Diagramme', 'Klimadiagramme', 'Strukturskizzen', 'Recherche und Präsentation'], GA],
      ['2', 'Klima und Klimawandel', ['Strahlungshaushalt', 'Drei-Zellen-Modell', 'Monsun', 'Ozeanzirkulation und ENSO', 'Klimawandel und Handlungsoptionen'], GA],
      ['3', 'Mensch-Umwelt-Beziehungen in den Tropen', ['Tropische Ökosysteme', 'Immerfeuchte Tropen', 'Nachhaltige Nutzung', 'Desertifikation'], GA],
      ['4', 'Subpolare und polare Zone', ['Naturgeographische Besonderheiten', 'Rohstoffgewinnung', 'Permafrost', 'Antarktisvertrag'], GA],
      ['5', 'Ressourcenkonflikte in Mittleren Breiten und Subtropen Europas', ['Wassermanagement', 'Hochwasser und Risikomanagement', 'Raumplanung', 'Waldmanagement'], GA],
      ['6', 'Nutzung und Vulnerabilität von Hochgebirgsräumen', ['Gebirgsbildung', 'Massenbewegungen', 'Gletscherrückgang', 'Eingriffe des Menschen'], GA],
      ['7', 'Risikomanagement bei tektonischen Ereignissen', ['Plattentektonik', 'Gefährdungspotenzial', 'Grenzen des Risikomanagements', 'Japan'], GA],
    ],
    13: [
      ['1', 'Geographische Arbeitstechniken', ['Satellitenbilder', 'Recherche und Präsentation', 'Modelle bewerten'], GA],
      ['2', 'Wirtschaftliche Entwicklungen in einer globalisierten Welt', ['Entwicklungsindikatoren', 'Globale Lieferketten', 'Fragmentierende Entwicklung', 'Entwicklungsstrategien', 'Ferntourismus'], GA],
      ['3', 'Ressourcen und nachhaltige Entwicklung', ['Rohstoffverfügbarkeit', 'Rohstoffabbau', 'Regenerative Energien', 'Energiemanagement'], GA],
      ['4', 'Bevölkerung und Migration', ['Demographischer Übergang', 'Ursachen von Migration', 'Flucht', 'Bevölkerungsentwicklung Deutschlands'], GA],
      ['5', 'Stadtentwicklung und urbane Räume', ['Urbanisierung und Stadtmodelle', 'Megastädte', 'Global Cities', 'Smart Cities'], GA],
    ],
  },
  'Wirtschaft und Recht': {
    8: [
      ['1.1', 'Entscheidungen beim Konsum', ['Knappheit und Bedürfnisse', 'Opportunitätskosten', 'Kosten-Nutzen-Analyse', 'Testberichte und Vergleichsportale', 'Entscheidungsmatrix', 'Preis-Qualitäts-Illusion'], WWG],
      ['1.2', 'Entscheidungen beim Umgang mit Geld', ['Geldfunktionen und Geldwert', 'Zahlungsarten', 'Digitales Bezahlen', 'Haushaltsplan', 'Überschuldung'], WWG],
      ['2.1', 'Betriebliche Abläufe und Arbeitsteilung', ['Arbeitsteilung', 'Aufbau- und Ablauforganisation', 'Fertigungstypen', 'Werkstatt- und Fließfertigung'], WWG],
      ['2.2', 'Marketingentscheidungen', ['Marktanalyse', 'Produkt- und Sortimentspolitik', 'Preispolitik', 'Distributionspolitik', 'Kommunikationspolitik'], WWG],
      ['3', 'Rechtlich verantwortliches Handeln', ['Funktionen des Rechts', 'Zivil- und Strafrecht', 'Deliktsfähigkeit und Strafmündigkeit', 'Tatbestand und Rechtsfolge', 'Medien- und Urheberrecht'], WWG],
    ],
    9: [
      ['1', 'Recht als Handlungsrahmen', ['Vertragsschluss', 'Pflichten im Kaufvertrag', 'Verpflichtungs- und Erfüllungsgeschäft', 'Besitz und Eigentum', 'Geschäftsfähigkeit', 'Gewährleistung'], WWG],
      ['2', 'Unternehmerisch denken und entscheiden', ['Geschäftsmodell und Marketing', 'Preiskalkulation, Standort, Rechtsform', 'Kapitalbedarf und Finanzierung', 'Bilanz und GuV', 'Kennzahlen'], WWG],
    ],
    10: [
      ['1', 'Ökonomisches Handeln auf dem Markt', ['Verbraucherentscheidungen und Nachhaltigkeit', 'Werbung und Verhaltensökonomie', 'Zahlungsarten', 'Geldanlage: Rendite, Liquidität, Sicherheit', 'Marktmodell und Gleichgewichtspreis']],
      ['2', 'Recht als Handlungsrahmen', ['Kaufvertrag', 'Besitz und Eigentum', 'Geschäftsfähigkeit', 'Mangelhafte Lieferung', 'Unerlaubte Handlung']],
      ['3', 'Entwicklung eines Geschäftsmodells', ['Geschäftsidee und Kernprozess', 'Unternehmerische Entscheidungen', 'Vereinfachte Bilanz', 'Projektmanagement']],
    ],
    11: [
      ['1', 'Die Wirtschaftsordnung als Handlungsrahmen', ['Preisfunktionen', 'Markt- und Zentralverwaltungswirtschaft', 'Soziale Marktwirtschaft', 'Steuern und soziale Sicherung', 'Strukturwandel']],
      ['2', 'Recht als Handlungsrahmen', ['Gerechtigkeit', 'Rechtsstaatsprinzipien', 'Gliederung des Rechts', 'Naturrecht und Rechtspositivismus', 'Eigentumsordnung']],
      ['3', 'Internationale wirtschaftliche Verflechtung', ['Freihandel und Handelshemmnisse', 'Kreislaufmodell', 'Wechselkurse', 'Wirtschafts- und Währungsunion']],
      ['4', 'Globale Zukunftstrends', ['Arbeitswelt', 'Finanzmärkte', 'Weltwirtschaft', 'Ressourcen']],
    ],
    12: [
      ['1', 'Betriebswirtschaftslehre', ['Unternehmensziele', 'Break-even-Analyse', 'Investitionsrechnung', 'Eigen- und Fremdfinanzierung', 'Rentabilität'], GA],
      ['2', 'Volkswirtschaftslehre', ['Magisches Viereck', 'Konjunkturzyklus', 'Arbeitslosigkeit', 'Bruttoinlandsprodukt', 'Steuern und Beiträge'], GA],
      ['3', 'Recht', ['Aufbau des BGB', 'Kaufvertrag und Trennungsprinzip', 'Herausgabeanspruch', 'Schadensersatz nach § 823 BGB'], GA],
    ],
    13: [
      ['1.1', 'Zivilrecht – Interessenausgleich beim Kauf', ['Leistungsstörungen', 'Schadensersatz', 'Verzug', 'Aliud-Lieferung', 'Widerruf bei Fernabsatz'], GA],
      ['1.2', 'Strafrecht', ['Aufbau einer Straftat', 'Tatbestand, Rechtswidrigkeit, Schuld', 'Strafzwecktheorien', 'Strafzumessung'], GA],
      ['2.1', 'Geld und Preisniveau', ['Preisniveaustabilität', 'Geldpolitik der EZB', 'Transmissionsmechanismus', 'Grenzen der Geldpolitik'], GA],
      ['2.2', 'Außenhandel und Währung', ['Leistungsbilanz', 'Außenwirtschaftliches Gleichgewicht', 'Wechselkursbildung', 'Wechselkursschwankungen'], GA],
    ],
  },
  'Politik und Gesellschaft': {
    10: [
      ['1', 'Werte leben im demokratischen Staat', ['Grundgesetz und Zusammenleben', 'Menschenwürde, Art. 1 GG', 'Grundrechte im Konflikt', 'Unveränderlicher Verfassungskern', 'Medien in der Demokratie']],
      ['2', 'Politische Verantwortung übernehmen für sich und andere', ['Mitwirkungsmöglichkeiten', 'Parteien', 'Wahlrechtsgrundsätze und Wahlsystem', 'Interessengruppen und Medien']],
      ['3', 'Das Zusammenwirken der politischen Institutionen in Deutschland verstehen', ['Politikzyklus', 'Gesetzgebungsverfahren', 'Bundesregierung, Bundestag, Bundesrat', 'Freies Mandat, Art. 38 GG']],
      ['4', 'Grundzüge der internationalen Zusammenarbeit erfassen', ['Ziele deutscher Außenpolitik', 'Internationale Organisationen', 'Verfassungsrechtliche Grundlagen']],
    ],
    11: [
      ['1', 'Demografische Entwicklung und gesellschaftlicher Zusammenhalt', ['Bevölkerungsstruktur', 'Demografischer Wandel', 'Generationenvertrag', 'Politische Lösungsansätze']],
      ['2', 'Politische Willensbildung im Medienzeitalter reflektieren', ['Medien als vierte Gewalt', 'Chancen und Gefahren medialer Vermittlung', 'Verschwörungsmythen', 'Desinformation im Netz']],
      ['3', 'Für den demokratischen Rechtsstaat eintreten', ['Rechtsstaatlichkeit', 'Wehrhafte Demokratie', 'Extremismus und Terrorismus', 'Populismus']],
      ['4', 'Die föderale Demokratie Deutschlands mitgestalten', ['Kommunalpolitik', 'Repräsentative und direkte Demokratie', 'Föderalismus und Zentralismus']],
      ['5', 'Die politische Gestaltung globalen Zusammenlebens reflektieren', ['Globalisierung', 'Bi- und multilaterale Politik', 'Vereinte Nationen', 'Gegenbewegungen']],
    ],
    12: [
      ['1', 'Frieden und Sicherheit als Motive deutscher Außenpolitik', ['Negativer und positiver Frieden', 'Erweiterter Sicherheitsbegriff', 'Hybride Bedrohungen', 'Zivile Konfliktbearbeitung'], GA],
      ['2', 'Das europäische Projekt verstehen und mitgestalten', ['Werte der EU', 'EU-Organe', 'Rechtsetzung in der EU', 'EU in der Weltpolitik', 'Zukunftsszenarien'], GA],
      ['3', 'Politische Systeme vergleichen und Demokratie wertschätzen', ['Menschenrechte als Maßstab', 'Hybride Regime', 'Parlamentarische und präsidentielle Demokratie', 'Antidemokratische Tendenzen'], GA],
      ['4', 'Möglichkeiten der Demokratieförderung beurteilen', ['State building', 'Demokratisierung von innen', 'Demokratieförderung von außen'], GA],
    ],
    13: [
      ['1', 'Modernisierungsprozesse und Zusammenleben in Deutschland', ['Familienformen', 'Familienpolitik', 'Geschlechterrollen', 'Sexismus'], GA],
      ['2', 'Soziale Ungleichheit und soziale Mobilität', ['Dimensionen sozialer Ungleichheit', 'Modelle sozialer Differenzierung', 'Aufstiegschancen und -barrieren'], GA],
      ['3', 'Der Sozialstaat und aktuelle Herausforderungen', ['Subsidiarität und Solidarität', 'Versicherungs- und Äquivalenzprinzip', 'Herausforderungen des Sozialstaats'], GA],
      ['4', 'Internationale Konfliktbearbeitung und Völkerrecht', ['Internationale Konflikte', 'NATO', 'Völkerrecht', 'Internationaler Strafgerichtshof'], GA],
    ],
  },
  'Katholische Religionslehre': {
    5: [
      ['1', 'Gott offenbart sich: die Bibel als Heilige Schrift des Christentums', ['Bibel im Alltag', 'Entstehung und Aufbau der Bibel', 'Umgang mit Bibeltexten', 'Bund zwischen Gott und Mensch', 'Psalmen']],
      ['2', 'Gott wird Mensch in Jesus Christus', ['Lebenswelt zur Zeit Jesu', 'Geburtserzählung bei Lukas', 'Advent und Weihnachten', 'Menschwerdung']],
      ['3', 'Menschen fragen nach Gott – Zugänge zum christlichen Gottesverständnis', ['Gottesbilder', 'Biblisches Gottesbild', 'Gott als liebender Vater', 'Credo', 'Gebet und Wallfahrt']],
      ['4', 'Wir sind alle Kinder des einen Gottes – miteinander leben', ['Vielfalt der Persönlichkeit', 'Gemeinschaft in der Klasse', 'Jesus als Vorbild', 'Vaterunser', 'Gebetsformen']],
      ['5', 'Heilige Orte: Kirchen als Mittelpunkte christlichen Glaubens', ['Kirchenraum: Altar, Ambo, Tabernakel', 'Baustile', 'Kirchenpatrone und Heilige', 'Eucharistiefeier', 'Gemeindeleben']],
    ],
    6: [
      ['1', 'Staunen und Nachdenken über Gottes Welt', ['Ursprung der Welt', 'Weltbilder von Römern und Germanen', 'Christliche Sinnantwort', 'Schöpfung']],
      ['2', 'Zwischen Scheitern und Gelingen – Erfahrungen im Alten Testament', ['Kain und Abel', 'Jakob und Esau', 'Josef und seine Brüder', 'Saul, David, Salomo']],
      ['3', 'Jesus Christus – Hoffnung in Leid und Tod', ['Leiderfahrungen', 'Option für die Armen', 'Kreuzigung und Auferstehung', 'Osterfestkreis', 'Emmaus']],
      ['4', 'Christliches Gemeindeleben: die Begeisterung des Anfangs', ['Pfingsten', 'Urgemeinde', 'Apostelkonzil', 'Konstantinische Wende']],
      ['5', 'Vielfalt der Kulturen – Solidarität im Namen Gottes', ['Lebensbedingungen von Kindern weltweit', 'Konsum und Lebensstil', 'Nächstenliebe', 'Kirchliche Hilfswerke']],
    ],
    7: [
      ['1', 'Auf dem Weg zu mir selbst – Herausforderungen im Jugendalter', ['Identitätsfindung', 'Selbstwertgefühl', 'Konflikte lösen', 'Vorbilder']],
      ['2', 'Symbole und Sakramente', ['Zeichen und Symbole', 'Christliche Symbole', 'Kirche als Grundsakrament', 'Messfeier', 'Taufe und Firmung']],
      ['3', 'Das Markusevangelium – Botschaft vom Reich Gottes', ['Gattung Evangelium', 'Zwei-Quellen-Theorie', 'Reich Gottes', 'Kaiserkult']],
      ['4', 'Kirche zwischen Macht und Spiritualität im Mittelalter', ['Klosterleben', 'Kirchenbau und Pilgern', 'Ketzerverfolgung', 'Kreuzzüge']],
      ['5', 'Muslimen begegnen – Glaube, Geschichte und Kultur des Islam', ['Fünf Säulen', 'Sunniten und Schiiten', 'Gottesverständnis', 'Nostra Aetate']],
    ],
    8: [
      ['1', 'Was ist der Mensch? Der Mensch in der Schöpfung', ['Menschenbilder', 'Gottebenbildlichkeit', 'Schöpfungsmythen', 'Schöpfungsspiritualität']],
      ['2', 'Von Gott berufen: prophetische Impulse für eine gerechtere Welt', ['Exodus und Dekalog', 'Amos, Jeremia, Jesaja', 'Soziale Missstände', 'Zivilcourage']],
      ['3', 'Reformation und katholische Reform', ['Frömmigkeit im Spätmittelalter', 'Luther und die Rechtfertigung', 'Konzil von Trient', 'Ökumene']],
      ['4', 'Zur Kirche gehören – aus dem Glauben handeln', ['Hilfswerke und Verbände', 'Fußwaschung', 'Pilgerndes Gottesvolk', 'Kirchenasyl']],
      ['5', 'Unterscheiden können: Vielfalt religiöser Angebote', ['Motive von Religiosität', 'Sekten und Fundamentalismus', 'Christliches Menschenbild als Maßstab']],
    ],
    9: [
      ['1', 'Christliche Verantwortung im Alltag: Orientierung in Entscheidungen', ['Gewissen und Gewissensfreiheit', 'Dekalog', 'Goldene Regel', 'Aktuelle Beispiele']],
      ['2', 'Jesus von Nazaret – Gott nimmt sich des Menschen an', ['Jesusdarstellungen', 'Zuwendung zu Ausgegrenzten', 'Vergebung', 'Sakrament der Versöhnung']],
      ['3', 'Freundschaft – Partnerschaft – Liebe', ['Schönheitsideale und Rollenbilder', 'Respekt und Achtsamkeit', 'Sexualität', 'Sakrament der Ehe']],
      ['4', 'Christsein in gesellschaftlicher Bedrängnis', ['Diskriminierung und Verfolgung', 'Anpassung und Widerstand', 'Religionsfreiheit']],
      ['5', 'Begegnung mit dem jüdischen Glauben', ['Jüdisches Leben vor Ort', 'Tora', 'Jüdische Identität', 'Der Jude Jesus', 'Geschichte des Judentums']],
    ],
    10: [
      ['1', 'Unantastbar: Recht auf Leben und Menschenwürde', ['Pränataldiagnostik', 'Schwangerschaftsabbruch', 'Sterbehilfe', 'Todesstrafe', 'Gewissen']],
      ['2', 'Tod und Auferstehung – christliche Hoffnung', ['Umgang mit dem Tod', 'Biblische Auferstehungsbotschaft', 'Reinkarnation', 'Hospizbewegung']],
      ['3', 'Jesus, der Christus', ['Auferweckung Jesu', 'Glaubensbekenntnis von Nizäa-Konstantinopel', 'Erlösung', 'Jesus in Judentum und Islam']],
      ['4', 'Auf der Suche nach Orientierung und Glück', ['Glücksversprechen der Medien', 'Hedonismus und Altruismus', 'Kohelet']],
      ['5', 'Begegnung mit Hinduismus und Buddhismus', ['Karma und Dharma', 'Vier edle Wahrheiten', 'Achtfacher Pfad', 'Nostra Aetate']],
    ],
    11: [
      ['1', 'Kirche im gesellschaftlichen Modernisierungsprozess', ['Autonomie der Vernunft', 'Pluralismus', 'Säkularisierung', 'Religionsfreiheit']],
      ['2', 'Der Mensch angesichts des medizinisch-technischen Fortschritts', ['Selbstoptimierung', 'In-vitro-Fertilisation', 'Leihmutterschaft', 'Palliativmedizin']],
      ['3', 'Theodizee – Ernstfall der Gottesfrage', ['Leiderfahrung', 'Theodizeeproblem', 'Tun-Ergehen-Zusammenhang', 'Compassion nach Metz']],
      ['4', 'Erkenntnis und Sprache – Zugänge zur religiösen Wirklichkeit', ['Wege der Welterfahrung', 'Grundfragen der Existenz', 'Religiöse Sprache', 'Negative Theologie']],
    ],
    12: [
      ['1.1', 'Personalität: Der Mensch und die Frage „Wer bin ich?“', ['Erwachsenwerden', 'Freiheit und Entscheidung', 'Konformismus', 'Menschenrechte'], GA],
      ['1.2', 'Das christliche Menschenbild als Leitlinie und Maßstab', ['Personalität und Sozialität', 'Gottebenbildlichkeit', 'Erlösungsbedürftigkeit', 'Menschenbilder'], GA],
      ['2.1', 'Der Mensch auf der Suche nach Gott', ['Religiöse Erfahrung', 'Religion und Glaube', 'Atheismus und Agnostizismus', 'Argumente für und gegen Gott'], GA],
      ['2.2', 'Gott sucht den Menschen', ['Bibel als Gotteswort', 'Fundamentalismus', 'Personalität Gottes', 'Trinität'], GA],
    ],
    13: [
      ['1.1', 'Sozialität: Ethische Grundlegung', ['Ethische Modelle', 'Gewissen', 'Christliche Ethik'], GA],
      ['1.2', 'Anwendung: Ethik der Lebensbereiche', ['Medizinethik', 'Wirtschafts- und Sozialethik', 'Umweltethik', 'Friedensethik'], GA],
      ['2', 'Existentielle Fragen und christliche Antwortangebote', ['Wahrheitsansprüche', 'Hoffnung', 'Tod und Vollendung'], GA],
    ],
  },
  'Evangelische Religionslehre': {
    5: [
      ['1', 'Ich und die anderen', ['Schulwechsel', 'Zehn Gebote', 'Doppelgebot der Liebe', 'Fairness']],
      ['2', 'Die Bibel und ihre Geschichten', ['Altes und Neues Testament', 'Bücher, Kapitel, Verse', 'Bibel als Glaubensbuch', 'Sprachbilder der Bibel']],
      ['3', 'Lebenswege mit Gott', ['Symbol Weg', 'Psalmen', 'Gottesbilder im Alten Testament', 'Gott als Befreier']],
      ['4', 'Von Gott erschaffen', ['Biblische Schöpfungstexte', 'Glaubensbekenntnis', 'Kleiner Katechismus', 'Würde jedes Menschen']],
      ['5', 'Spuren des Glaubens', ['Kirchengebäude', 'Kreuz, Taube, Licht', 'Kirchengemeinde', 'Taufe, Abendmahl, Konfirmation']],
    ],
    6: [
      ['1', 'In Beziehung', ['Familie', 'Freundschaft', 'Umgang mit Konflikten']],
      ['2', 'Zwischen Galiläa und Jerusalem', ['Leben zur Zeit Jesu', 'Gruppen im Judentum', 'Jüdischer Glaube', 'Jüdisches Leben heute']],
      ['3', 'Mitten unter euch – Jesu Botschaft und Leben', ['Evangelien', 'Reich Gottes', 'Reaktionen auf Jesus', 'Passion und Ostern']],
      ['4', 'Feste und Auszeiten', ['Bedeutung von Festen', 'Kirchenjahr', 'Christliche Feste gestalten']],
      ['5', 'Anders – fremd – verschieden', ['Fremdsein', 'Verschiedenheit als Bereicherung', 'Vorurteile']],
    ],
    7: [
      ['1', 'Glaube findet Sprache', ['Glaubensbekenntnis, 3. Artikel', 'Kirchenbau in Epochen', 'Elemente des Gottesdienstes']],
      ['2', 'Kirche hat Geschichte', ['Pfingsten', 'Ausbreitung des Christentums', 'Christenverfolgung', 'Konstantinische Wende']],
      ['3', 'Islam', ['Fünf Säulen', 'Mohammed in Mekka und Medina', 'Vielfalt des Islam', 'Islam im Alltag']],
      ['4', 'Ich und meine Wünsche', ['Wünsche und Träume', 'Medien und Idole', 'Sucht und Abhängigkeit']],
      ['5', 'Nächstenliebe und diakonisches Handeln der Kirche', ['Hilfsbedürftigkeit', 'Grenzen des Helfens', 'Anfänge der Diakonie', 'Johann Hinrich Wichern']],
    ],
    8: [
      ['1', 'Voraussetzungen und Folgen der Reformation', ['Ablasswesen', 'Thesenanschlag', 'Bauernkrieg', 'Bildersturm']],
      ['2', 'Propheten und die Frage nach Gerechtigkeit', ['Exodustradition', 'Berufung und Visionen', 'Jeremia und Amos', 'Einsatz für Schwache']],
      ['3', 'Die Welt als Gottes Schöpfung', ['Sach- und Sinnfragen', 'Ebenbildlichkeit und Herrschaftsauftrag', 'Kreationismus und Evolution']],
      ['4', 'Ich in der Zeit', ['Zeitdruck', 'Lebenszeit als Gabe', 'Gott als Herr der Zeit']],
      ['5', 'Vielfalt des Glaubens', ['Konfessionen', 'Ämter und Abendmahl', 'Taizé', 'Toleranz']],
    ],
    9: [
      ['1', 'Frei im Netz!?', ['Internetnutzung', 'Chancen digitaler Vernetzung', 'Abhängigkeiten', 'Menschenwürde im Netz']],
      ['2', 'Der Glaube an Jesus Christus', ['Christliche Bekenntnisse', 'Tod und Auferstehung', 'Evangelientexte', 'Jesus in anderen Religionen']],
      ['3', 'Judentum', ['Jüdischer Glaube', 'Jüdische Feste und Kultur', 'Strömungen des Judentums', 'Antisemitismus']],
      ['4', 'Das Verhältnis von Kirche und Staat', ['Kirche und Staat in Deutschland', 'Kirche im Nationalsozialismus', 'Kirche in der DDR']],
      ['5', 'Liebe – der Himmel auf Erden?', ['Beziehungen', 'Bedeutungen von Liebe', 'Liebe zwischen Gott und Mensch']],
    ],
    10: [
      ['1', 'Wie halt ich’s mit der Religion?', ['Religionssoziologie', 'Religionspsychologie', 'Religionsbegriffe', 'Religion, Kirche, Glaube']],
      ['2', 'Buddhismus', ['Meditation', 'Reinkarnation', 'Lehre Buddhas', 'Lebensführung']],
      ['3', 'Zum Glück?!', ['Dimensionen von Glück', 'Glücksforschung', 'Antike Glücksvorstellungen', 'Gelingendes Leben biblisch']],
      ['4', 'Mitten im Tod: das Leben', ['Abschied und Trauer', 'Auferstehungsglaube', 'Sterbehilfe']],
      ['5', 'Gerechtigkeit und Frieden in der einen Welt', ['Globale Vernetzung', 'Gerechtigkeitsbegriffe', 'Biblische Friedensvisionen', 'Kirchliche Initiativen']],
    ],
    11: [
      ['1', 'Glaube und Vernunft', ['Aufklärung und Mündigkeit', 'Deismus und Pietismus', 'Glaube und Naturwissenschaft', 'Fundamentalismus']],
      ['2', 'Freiheit leben', ['Freiheit und Bedingtheit', 'Biblische Freiheitsmotive', 'Luther: Von der Freiheit', 'Gewissen']],
      ['3', 'Sola scriptura!? – Zugänge zur Bibel', ['Aufbau der Bibel', 'Historisch-kritische Auslegung', 'Weitere Lesarten', 'Evangelisches Schriftverständnis']],
      ['4', 'Judentum, Christentum, Islam', ['Stereotype', 'Beziehungen der Religionen', 'Abraham', 'Wahrheitsansprüche']],
    ],
    12: [
      ['1', 'Woran dein Herz hängt – Sinnfrage und Gottesfrage', ['Sinnangebote', 'Gottesfrage', 'Theodizee bei Hiob', 'Feuerbachs Projektionstheorie'], GA],
      ['2', 'Der im-perfekte Mensch', ['Perfektion', 'Identität', 'Aggression', 'Sünde und Rechtfertigung'], GA],
      ['3', 'Homo faber – der Mensch und seine Möglichkeiten', ['Leistung', 'Philosophische Anthropologie', 'Beruf und Berufung bei Luther', 'Entfremdung bei Marx'], GA],
      ['4', 'Christsein in der Gesellschaft', ['Individuum und Gesellschaft', 'Zoon politikon', 'Rolle der Kirche', 'Zwei-Reiche-Lehre'], GA],
    ],
    13: [
      ['1', 'Die Frage nach dem guten Leben und richtigen Handeln', ['Gutes Leben', 'Ethische Grundbegriffe', 'Ethische Modelle', 'Christliche Ethik'], GA],
      ['2', 'Differenzierte Perspektiven auf ethische Probleme', ['Medizin-, Friedens-, Umweltethik', 'Urteilsbildung', 'Kognitive Verzerrungen'], GA],
      ['3', 'Christliche Hoffnungsbilder', ['Zukunftsvisionen', 'Endlichkeit', 'Überwindung des Todes', 'Eschatologie'], GA],
    ],
  },
  Ethik: {
    5: [
      ['1', 'Wahrnehmung und Bedürfnisse', ['Sinneswahrnehmung', 'Vorurteil und Stereotyp', 'Grundbedürfnisse', 'Goldene Regel']],
      ['2', 'Familie', ['Familienformen', 'Entscheidungen in der Familie', 'Zuhören und Ich-Botschaften', 'Armut']],
      ['3', 'Spielen', ['Spielregeln', 'Fairness', 'Gesellschafts- und Theaterspiele']],
      ['4', 'Feste', ['Feste in der Schule', 'Private Feste', 'Laubhüttenfest', 'Weihnachten und Ostern']],
    ],
    6: [
      ['1', 'Judentum und Christentum', ['Heilige Schriften', 'Bergpredigt', 'Barmherziger Samariter']],
      ['2', 'Umgang mit Medien', ['Täuschung und Manipulation', 'Eigene Mediennutzung', 'Selbstkontrolle']],
      ['3', 'Dem Anderen begegnen', ['Selbstentfaltung und Selbstbegrenzung', 'Kommunikation unter Gleichaltrigen', 'Der Andere als Bereicherung']],
      ['4', 'Konsum und Freizeit', ['Verantwortungsbewusster Konsum', 'Werbung', 'Marken als Statussymbole']],
    ],
    7: [
      ['1', 'Islam', ['Mohammed', 'Fünf Säulen', 'Muslime und Islamisten', 'Muslime in Deutschland']],
      ['2', 'Konflikte und ihre Regelung', ['Sach- und Beziehungsebene', 'Konfliktursachen', 'Mobbing', 'Umgang mit Wut']],
      ['3', 'Erwachsen werden', ['Identität', 'Rechte und Pflichten Jugendlicher', 'Jugendschutz und Strafmündigkeit', 'Lebensentwürfe']],
    ],
    8: [
      ['1', 'Sinnsuche', ['Selbsttranszendenz', 'Sucht- und Depressionsprävention', 'Sinn in Ausnahmesituationen', 'Sekten']],
      ['2', 'Soziales Engagement', ['Engagement vor Ort', 'Globales Engagement', 'Ehrenamt', 'Vorbilder']],
      ['3', 'Liebe, Freundschaft, Sexualität', ['Freundschaft', 'Verliebtheit und Liebe', 'Erwartungen in Beziehungen', 'Geschlechterrollen']],
      ['4', 'Umwelt- und Tierethik', ['Begründungen für Umweltschutz', 'Lebensgewohnheiten', 'Moralischer Status von Tieren', 'Massentierhaltung']],
    ],
    9: [
      ['1', 'Fernöstliche Religionen', ['Samsara', 'Vier Edle Wahrheiten', 'Achtfacher Pfad']],
      ['2', 'Gewissen und Verantwortung', ['Gewissen als innerer Gerichtshof', 'Über-Ich und Ich-Ideal', 'Folgen einer Handlung']],
      ['3', 'Friedensethik', ['Krieg in Medien', 'Gewaltfreie Kommunikation', 'Deeskalation', 'Pazifismus']],
      ['4', 'Arbeitsethik', ['Status und Selbstwert', 'Work-Life-Balance', 'Gleichberechtigung']],
    ],
    10: [
      ['1', 'Ursprünge des Philosophierens', ['Staunen und Zweifeln', 'Gedankenexperiment', 'Mythos und Logos', 'Skeptizismus']],
      ['2', 'Religionsphilosophie und vergleichende Religionsbetrachtung', ['Theodizee', 'Gottesbeweise', 'Religionskritik', 'Atheismus und Agnostizismus']],
      ['3', 'Wirtschaftsethik', ['Entfremdete Arbeit', 'Warenfetischismus', 'Homo oeconomicus', 'Ultimatumspiel']],
      ['4', 'Medienethik', ['Realität und Virtualität', 'Information und Meinung', 'Pressekodex', 'Datenschutz und Urheberrecht']],
    ],
    11: [
      ['1', 'Philosophische Deutung des Menschen', ['Evolution des Menschen', 'Freuds Instanzenmodell', 'Höhlengleichnis', 'Kategorischer Imperativ']],
      ['2', 'Politische Ethik', ['Staatsformen', 'Gesellschaftsvertrag: Hobbes, Rousseau', 'Widerstandsrecht', 'Populismus']],
      ['3', 'Medizinethik', ['Praktischer Syllogismus', 'Sein-Sollen-Fehlschluss', 'Dammbruchargument', 'Person und moralischer Status']],
    ],
    12: [
      ['1', 'Theorie und Praxis des Handelns', ['Handlung, Absicht, Mittel', 'Tugendethik', 'Kategorischer Imperativ', 'Utilitarismus'], GA],
      ['2', 'Freiheit und Determination', ['Willensschwäche', 'Autonomie des Willens', 'Positive und negative Freiheit', 'Libet-Experiment'], GA],
    ],
    13: [
      ['1', 'Recht und Gerechtigkeit', ['Ausgleichende und verteilende Gerechtigkeit', 'Rechtspositivismus', 'Strafzwecktheorien', 'Täter-Opfer-Ausgleich'], GA],
      ['2', 'Sinnorientierung und Lebensgestaltung', ['Eudaimonie', 'Ataraxie und Autarkie', 'Sinnsetzung', 'Flow'], GA],
    ],
  },
  Musik: {
    5: [
      ['1', 'Sprechen – Singen – Musizieren', ['Volksmusik in Mundart', 'Bräuche und Jahreszeiten', 'Sprechstücke', 'Vor- und Nachspiele']],
      ['2', 'Musik – Mensch – Zeit', ['Mozart als Wunderkind', 'Haydn: Esterházy und London', 'Sinfonie, Streichquartett, Oratorium', 'Melodie und Dreiklang']],
      ['3', 'Bewegung – Tanz – Szene', ['Bodypercussion', 'Volkstanzschritte', 'Schattenspiel']],
      ['4', 'Musik und ihre Grundlagen', ['Violin- und Bassschlüssel', 'Notenwerte bis Sechzehntel', 'Dur-Tonleitern', 'Dur-Dreiklang', 'Tempobezeichnungen']],
    ],
    6: [
      ['1', 'Sprechen – Singen – Musizieren', ['Lieder und Kanons', 'Europäische Volksmusik', 'Liedbegleitung', 'Stimmbildung']],
      ['2', 'Musik – Mensch – Zeit', ['Bach: Inventionen', 'Brandenburgische Konzerte', 'Kantate und Passion']],
      ['3', 'Bewegung – Tanz – Szene', ['Menuett', 'Pavane', 'Kontratanz', 'Pantomime']],
      ['4', 'Musik und ihre Grundlagen', ['Imitation und unisono', 'Legato, staccato, Akzent', 'Triole und Taktwechsel', 'Zusammengesetzte Taktarten', 'Intervalle', 'Umkehrungen des Dreiklangs']],
    ],
    7: [
      ['1', 'Sprechen – Singen – Musizieren', ['Lateinamerikanische Lieder', 'Akkordfolgen in Rock und Rap', 'Stimme in der Mutation']],
      ['2', 'Musik – Mensch – Zeit', ['Beethoven', 'Schubert: Lied und Sinfonie', 'Dvořák und der Nationalgedanke', 'Bernstein']],
      ['3', 'Bewegung – Tanz – Szene', ['Bodypercussion', 'Blues, Hardrock, Rap', 'Standbild und Schattenspiel']],
      ['4', 'Musik und ihre Grundlagen', ['Kadenz', 'Haupt- und Nebenstufen', 'Synkope und Off-Beat', 'Dominantseptakkord']],
    ],
    8: [
      ['1', 'Sprechen – Singen – Musizieren', ['Funktion von Instrumenten', 'Musik in Ritualen', 'Improvisation', 'Arrangements']],
      ['2', 'Musik – Mensch – Zeit', ['Filmmusik und Soundtracks', 'Musikpsychologie', 'Musik in Werbung und Alltag', 'Stile der Popularmusik']],
      ['3', 'Bewegung – Tanz – Szene', ['Afrikanischer Maskentanz', 'Capoeira', 'Musicalverfilmung']],
      ['4', 'Musik und ihre Grundlagen', ['Rock’n’Roll, Punk, Techno', 'Tonvorrat', 'Naturtonreihe']],
    ],
    9: [
      ['1', 'Sprechen – Singen – Musizieren', ['Klavierlied', 'Leitmotivtechnik', 'Improvisation nach Formabläufen', 'Dirigieren']],
      ['2', 'Musik – Mensch – Zeit', ['Sonatensatzform', 'Romantik', 'Oper und Musical', 'Programmmusik']],
      ['3', 'Bewegung – Tanz – Szene', ['Pantomime', 'Rollenspiel', 'Bühnenbild']],
      ['4', 'Musik und ihre Grundlagen', ['Instrumentierung', 'Charakterstück', 'Sinfonische Dichtung', 'Rezitativ', 'Zwischendominante']],
    ],
    10: [
      ['1', 'Sprechen – Singen – Musizieren', ['Musizieren im Jazz', 'Atonales Komponieren', 'Barocke Strukturen', 'Multimedia']],
      ['2', 'Musik – Mensch – Zeit', ['Konzert', 'Kantate und Oratorium', 'Debussy und Impressionismus', 'Zweite Wiener Schule', 'Blues, Swing, Bebop, Cool Jazz']],
      ['3', 'Bewegung – Tanz – Szene', ['Modern Dance', 'Cakewalk und Charleston']],
      ['4', 'Musik und ihre Grundlagen', ['Concerto, Suite, Oratorium', 'Zwölftontechnik', 'Collage', 'Triosonate und Generalbass']],
    ],
    11: [
      ['1', 'Musik politisch', ['Politisches Lied im 19. Jahrhundert', 'Märsche und Kampflieder', 'Entartete Musik', 'Musik im Nationalsozialismus']],
      ['2', 'Musik interdisziplinär', ['Pythagoras und Intervalle', 'Goldener Schnitt', 'Gabrieli in Venedig', 'Wagner in Bayreuth']],
      ['3', 'Musik kreativ', ['Notensatzprogramm', 'Soundscape', 'Zwölftonreihe', 'Aleatorik und Minimal Music']],
      ['4', 'Musik explorativ', ['Sinfonie, Sonate, Oper', 'Dirigieren: Schlagfiguren', 'Probengestaltung', 'Interpretation']],
    ],
    12: [
      ['1', 'Entwicklungen abendländischer Vokalmusik', ['Kantate und Oratorium', 'Oper der Wiener Klassik', 'Kunstlied der Romantik', 'Schubert und Schumann'], GA],
      ['2.1', 'Musik und Tradition', ['Volksmusik in der Kunstmusik', 'Dies irae', 'Traditionsbrüche', 'Emanzipation der Dissonanz'], GA],
      ['2.2', 'Musik und Technik', ['Digitale Verfahren', 'Elektronische Instrumente', 'Verbreitung von Musik', 'Musik des 20. und 21. Jahrhunderts'], GA],
    ],
    13: [
      ['1', 'Entwicklungen abendländischer Instrumentalmusik', ['Barock und Polyphonie', 'Concerto-Prinzip', 'Klassik', 'Programmmusik und absolute Musik'], GA],
      ['2', 'Ausgewählte Musik seit Beginn des 20. Jahrhunderts', ['Impressionismus', 'Minimal Music', 'Klangflächen', 'Reihentechnik', 'Grafische Notation'], GA],
    ],
  },
  Kunst: {
    5: [
      ['1', 'Bildende Kunst', ['Pigmente und Bindemittel', 'Deckender und lasierender Farbauftrag', 'Farbkontraste', 'Bedeutungsperspektive', 'Modellieren mit Ton']],
      ['2', 'Architektur und Produktdesign', ['Schmuck und Alltagsgegenstände', 'Pfahlbau und Pyramide', 'Sakrale und profane Bauten', 'Modellbau']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Bilderschrift und Lautschrift', 'Schmuckschrift', 'Szenisches Spiel', 'Filmische Mittel']],
    ],
    6: [
      ['1', 'Bildende Kunst', ['Raumdarstellung in der Zeichnung', 'Archaik, Klassik, Hellenismus', 'Kontrapost, Relief, Mosaik', 'Fresko und Tempera', 'Mythologie']],
      ['2', 'Architektur und Produktdesign', ['Gefäße aus Ton', 'Engobe und Glasur', 'Tempel, Basilika, Forum', 'Römisches Wohnhaus']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Bildergeschichte und Plakat', 'Capitalis quadrata', 'Fotografische Mittel']],
    ],
    7: [
      ['1', 'Bildende Kunst', ['Kontur und Schraffur', 'Parallelperspektive', 'Komplementärkontrast', 'Mittelalterliche Ikonografie']],
      ['2', 'Architektur und Produktdesign', ['Rund- und Spitzbogen', 'Tonnen- und Kreuzrippengewölbe', 'Romanik und Gotik', 'Kirche und Moschee']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Figur und Grund', 'Linie und Fläche', 'Drucktechniken', 'Buchdruck']],
    ],
    8: [
      ['1', 'Bildende Kunst', ['Zentralperspektive', 'Fluchtpunkt', 'Ölmalerei', 'Goldener Schnitt', 'Renaissance und Barock']],
      ['2', 'Architektur und Produktdesign', ['Grundriss, Schnitt, Ansicht', 'Modellbau', 'Licht und Raum']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Layout und Fotografie', 'Form und Inhalt', 'Logo und Wiedererkennung', 'Typografie']],
    ],
    9: [
      ['1', 'Bildende Kunst', ['Porträt und Figur', 'Proportionen', 'Klassizismus, Romantik, Realismus', 'Komposition']],
      ['2', 'Architektur und Produktdesign', ['Moodboard', 'Mode und Kleidung', 'Schmuck und Ornament', 'Product-Placement']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Jugendkulturen', 'Blende, Schärfentiefe, Licht', 'Street-Art und Graffiti', 'Recht am eigenen Bild']],
    ],
    10: [
      ['1', 'Bildende Kunst', ['Lokalfarbe', 'Additive und subtraktive Farbmischung', 'Farbkontraste nach Itten', 'Impressionismus']],
      ['2', 'Architektur und Produktdesign', ['Funktionen von Design', 'Möbel und Innenarchitektur', 'Industrieprodukt und Unikat', 'Ressourcen']],
      ['3', 'Interaktion, Inszenierung und Kommunikation', ['Erklärende Zeichnung', 'Bildserie', 'Presse- und Werbefotografie', 'Bildbearbeitung']],
    ],
    11: [
      ['1', 'Bildende Kunst', ['Klassische Moderne', 'Figuration und Abstraktion', 'Kunst und Politik', 'Intermediale Experimente']],
      ['2', 'Architektur und Produktdesign', ['Lageplan und Grundriss', 'Urban Sketching', 'Idealstadt und Gartenstadt', 'Denkmalschutz']],
      ['3', 'Interaktion und Kommunikation', ['Moodboard', 'Forschungsplakat', 'AIDA-Formel', 'Branding']],
    ],
    12: [
      ['1', 'Objekt', ['Explosionszeichnung', 'Readymade', 'Assemblage', 'Stillleben'], GA],
      ['2', 'Raum', ['Grund- und Aufriss', 'Schnitt', 'Minimal Housing', 'Raumillusion'], GA],
    ],
    13: [
      ['1', 'Körper', ['Figuration', 'Abstraktion', 'Deformation', 'Vergänglichkeit'], GA],
      ['2', 'Interaktion und Transformation', ['Klimawandel', 'Migration', 'Performance', 'Installation'], GA],
    ],
  },
  Wirtschaftsinformatik: {
    9: [
      ['1', 'Informationstechnologie im Unternehmen', ['Hardware und EVA-Prinzip', 'Softwarearten', 'Client-Server-Prinzip', 'Netzwerktopologien'], WWG],
      ['2.1', 'Beschaffung und Aufbereitung von Informationen', ['Informationsquellen', 'Informationen filtern', 'Tabellenkalkulation: Formatierung', 'Relative und absolute Zellbezüge'], WWG],
      ['2.2', 'Darstellung des Unternehmens nach außen', ['Corporate Identity', 'Zielgruppengerechte Information', 'Diagramme', 'Layoutregeln'], WWG],
      ['3', 'Datenspuren und Datenschutz', ['Digitale Datenspuren', 'Personenbezogene Daten', 'Datenschutzrecht'], WWG],
      ['4', 'IT-Sicherheit und Internetkriminalität', ['Schutzziele der IT-Sicherheit', 'Schutzmaßnahmen', 'Verschlüsselung', 'Angriffsarten'], WWG],
    ],
    10: [
      ['1.1', 'Das Unternehmen als synergetisches System', ['Organigramm', 'Ereignisgesteuerte Prozessketten', 'Aufbau- und Ablauforganisation'], WWG],
      ['1.2', 'Logistik als bereichsübergreifender Prozess', ['6R der Logistik', 'Beschaffungs-, Produktions-, Distributionslogistik', 'Routenplanung'], WWG],
      ['1.3', 'Beschaffung, Produktion und Absatz', ['Erweiterte EPK', 'Qualität, Zeit, Kosten', 'Just-in-time', 'E-Commerce'], WWG],
      ['2', 'Algorithmik', ['Algorithmusbegriff', 'Variablen', 'Felder und Listen', 'Kontrollstrukturen', 'Sortierverfahren'], WWG],
      ['3', 'Informationstechnologische Zukunftstrends', ['Künstliche Intelligenz', 'Cyberphysische Systeme', 'Blockchain', 'Sprachverarbeitung'], WWG],
    ],
  }
};
LP.Deutsch[13] = LP.Deutsch[12];
LP.Englisch[13] = LP.Englisch[12];

export const FAECHER = Object.keys(LP).sort((a, b) => a.localeCompare(b, "de"));
export const UMFANG = [5, 10, 20, 30, 45, 60, 90];

/** Lernbereiche für Fach und Jahrgangsstufe, mit Schlüssel und Hinweis */
export function lernbereiche(fach, jgst) {
  const list = LP[fach]?.[jgst] || [];
  return list.map(([nr, t, k, g], i) => ({ id: `${fach}|${jgst}|${i}`, nr, t, k, g: g || '' }));
}
export const HINWEIS = {
  'Physik|5': 'Physik ist in Jahrgangsstufe 5 Teil von Natur und Technik.',
  'Physik|7': 'Physik ist in Jahrgangsstufe 7 Teil von Natur und Technik.',
  'Informatik|6': 'Informatik ist in Jahrgangsstufe 6 Teil von Natur und Technik.',
  'Informatik|7': 'Informatik ist in Jahrgangsstufe 7 Teil von Natur und Technik.',
  'Deutsch|12': 'Der Fachlehrplan Deutsch gilt für 12 und 13 gemeinsam.',
  'Deutsch|13': 'Der Fachlehrplan Deutsch gilt für 12 und 13 gemeinsam.',
  'Latein|9': 'Ab Jahrgangsstufe 9 gilt ein gemeinsamer Lehrplan für Latein als 1. und 2. Fremdsprache.',
  'Geschichte|12': 'Hinterlegt ist das grundlegende Anforderungsniveau.',
  'Geschichte|13': 'Hinterlegt ist das grundlegende Anforderungsniveau.',
  'Biologie|5': 'Biologie ist in Jahrgangsstufe 5 und 6 Teil von Natur und Technik.',
  'Biologie|6': 'Biologie ist in Jahrgangsstufe 5 und 6 Teil von Natur und Technik.',
  'Biologie|11': 'Der Fachlehrplan Biologie 11 wird gerade überarbeitet und ist deshalb noch nicht hinterlegt.',
  'Chemie|9': 'Hinterlegt sind beide Varianten: NTG und HG, SG, MuG, WWG, SWG.',
  'Chemie|10': 'Hinterlegt sind beide Varianten: NTG und HG, SG, MuG, WWG, SWG.',
  'Chemie|11': 'Chemie 11 gibt es nur am NTG.',
  'Chemie|13': 'Chemie 13 ist noch nicht hinterlegt – bitte den Fachlehrplan öffnen.',
  'Englisch|6': 'Hinterlegt ist Englisch als 1. Fremdsprache.', 'Englisch|7': 'Hinterlegt ist Englisch als 1. Fremdsprache.',
  'Englisch|8': 'Hinterlegt ist Englisch als 1. Fremdsprache.', 'Englisch|9': 'Hinterlegt ist Englisch als 1. Fremdsprache.',
  'Englisch|12': 'Der Fachlehrplan gilt für 12 und 13 gemeinsam; hinterlegt ist das grundlegende Anforderungsniveau.',
  'Englisch|13': 'Der Fachlehrplan gilt für 12 und 13 gemeinsam; hinterlegt ist das grundlegende Anforderungsniveau.',
  'Französisch|6': 'Hinterlegt ist Französisch als 2. Fremdsprache.', 'Französisch|7': 'Hinterlegt ist Französisch als 2. Fremdsprache.',
  'Französisch|8': 'Hinterlegt ist Französisch als 2. Fremdsprache.', 'Französisch|9': 'Hinterlegt ist Französisch als 2. Fremdsprache.',
  'Französisch|12': 'Französisch 12/13 ist noch nicht hinterlegt – bitte den Fachlehrplan öffnen.',
  'Französisch|13': 'Französisch 12/13 ist noch nicht hinterlegt – bitte den Fachlehrplan öffnen.',
  'Wirtschaft und Recht|8': 'Wirtschaft und Recht 8 und 9 gibt es am WWG.', 'Wirtschaft und Recht|9': 'Wirtschaft und Recht 8 und 9 gibt es am WWG.',
  'Wirtschaft und Recht|10': 'Hinterlegt ist der Lehrplan für HG, SG, NTG, MuG und SWG.', 'Wirtschaft und Recht|11': 'Hinterlegt ist der Lehrplan für HG, SG, NTG, MuG und SWG.',
  'Politik und Gesellschaft|10': 'Hinterlegt ist der Lehrplan für HG, SG, NTG, MuG und WWG.', 'Politik und Gesellschaft|11': 'Hinterlegt ist der Lehrplan für HG, SG, NTG, MuG und WWG.',
  'Wirtschaftsinformatik|9': 'Wirtschaftsinformatik gibt es am WWG.', 'Wirtschaftsinformatik|10': 'Wirtschaftsinformatik gibt es am WWG.',
};
for (const f of ['Spanisch', 'Italienisch', 'Russisch', 'Griechisch']) for (const j of [8, 9, 10, 11]) HINWEIS[f + '|' + j] = `Hinterlegt ist ${f} als 3. Fremdsprache.`;
for (const f of ['Biologie', 'Chemie', 'Geographie', 'Wirtschaft und Recht', 'Politik und Gesellschaft', 'Katholische Religionslehre', 'Evangelische Religionslehre', 'Ethik', 'Musik', 'Kunst'])
  for (const j of [12, 13]) HINWEIS[f + '|' + j] = HINWEIS[f + '|' + j] || 'Hinterlegt ist das grundlegende Anforderungsniveau.';
