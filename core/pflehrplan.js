// LehrplanPLUS Bayern, Gymnasium (G9), Fachlehrpläne – Lernbereiche mit Inhalts-Schlagworten
// Quelle: https://www.lehrplanplus.bayern.de (Fachlehrpläne), Stand der Übernahme: November 2026.
// Schlagworte sind Kurzfassungen der „Inhalte zu den Kompetenzen“, keine wörtlichen Zitate.
// Aufbau: LP[Fach][Jahrgangsstufe] = [[Nummer, Titel, [Schlagworte], Gruppe?], …]
// Gruppe (optional) trennt Varianten, z. B. Anforderungsniveau oder Ausbildungsrichtung.

export const SOURCE = 'LehrplanPLUS Bayern, Gymnasium, Fachlehrpläne';
export const URL = (fach, jgst) => {
  jgst = +jgst;
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
  }
};
LP.Deutsch[13] = LP.Deutsch[12];

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
  'Geschichte|13': 'Hinterlegt ist das grundlegende Anforderungsniveau.'
};
