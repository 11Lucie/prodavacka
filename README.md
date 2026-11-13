# Prodavačka – hra na obchod 🛒

Hra na obchod pro tablet nebo telefon. Má dlaždice se zbožím, které vydávají zvuk, oddělení jako v obchodě
(Ovoce, Zelenina…), placení kartou a hotově, věrnostní body a odměny. Účtenku vytiskne na malou Bluetooth
tiskárnu (MX05 / Vysio Miniprint C15, která jinak jede přes aplikaci FunPrint).

Je to webová stránka, ne APK. Proto ji jde používat i na dětském účtu (Family Link).
Všechno se ukládá jen v daném zařízení a nic se nikam neodesílá. Jediné, co z aplikace odchází, je účtenka do tiskárny.

## Co umí
- **Dlaždice zboží**: název, cena, obrázek (smajlík), barva a zvuk. Nové se zakládají přes ✏️ (režim úprav).
- **Oddělení**: vlastní název, obrázek a barva. Taky přes ✏️ (na vybrané oddělení se klepne ještě jednou).
- **Kdo obsluhuje**: jméno nahoře vpravo. Tiskne se na účtenku.
- **Název obchodu, druhý řádek a text na konci účtenky**: klepnutím na název obchodu.
- **Placení**: kartou (terminál pípne a „schválí“), nebo hotově (kalkulačka spočítá, kolik vrátit).
- **Věrnostní body**: karty zákazníků (Maminka, Tatínek…), připsání bodů, strhnutí bodů za odměnu nebo ručně.
  Platit se dá i s prázdným košíkem, to je „jen body“. Všechno se objeví na účtence.
- **Tisk účtenky** na Bluetooth tiskárnu. Ještě před tiskem je vidět náhled.
- **Záloha** do souboru a obnovení ze zálohy (⚙️ Nastavení).

## Jak ji spustit na tabletu
1. Otevřít v **Chrome** adresu hry (https://…).
2. V menu Chrome (⋮) dát **Přidat na plochu**. Pak se hra spouští jako aplikace a funguje i bez internetu.
3. Tiskárna: zapnout ji a na tabletu zapnout Bluetooth. Pak 🖨️ → **Připojit tiskárnu** → vybrat „MX05“.
   - Tiskárnu **nepárovat** v nastavení Androidu, stačí ji vybrat ve hře.
   - Zavřít aplikaci FunPrint, protože tiskárna mluví jen s jednou aplikací naráz.
   - Když tiskne nesmysly nebo jen kus účtenky: 🖨️ → Přenos dat → **Pomalý**.
   - Když je tisk moc slabý nebo moc tmavý: 🖨️ → **Sytost tisku**.

Tisk funguje v Chrome na Androidu a v Chrome nebo Edge na počítači. Na iPhonu/iPadu nefunguje, protože Safari neumí Web Bluetooth.

## Pro správce
- Čisté HTML, CSS a JS bez sestavování. `sw.js` zajišťuje běh bez internetu. Při změně souborů zvýšit `VERZE` v `sw.js`.
- Protokol tiskárny je v `printer.js` (pakety `51 78 …`, CRC-8, 384 bodů na řádek). Podle NaitLee/Cat-Printer, kitty-printer a rbaron/catprinter.
- Test bajtů pro tiskárnu: `node nastroje/test-protokol.js`
- Ikony: `python nastroje/ikony.py icons`
