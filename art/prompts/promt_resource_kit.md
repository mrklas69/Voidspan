Vygeneruj kompletní grafickı resource kit pro mou jednoduchou hru!
Forma: textbased strategie s pixelart (nízké rozlišení, 16 color palette)
Obsah: Hráè na orbitu buduje kosmickou základnu z políèek/dladic
Grafickı set: ètvercové resp. obdélníkové dladice 2D (ne iso2D) pohled shora, pomìry stran 1x1, 1x2, 1x3 a 2x2, vyobrazení vyuívá prùhlednost (zaoblené rohy, díry ve skeletu, ...)
(Celé by mohlo fungovat jako stolní hra, tj. dladice by se daly vkládat do gridu napø. tile-placement, Carcassonne.)
Styl: Jednoduchı (Commodore/Atari 8bit) Ale ne èisté plochy povrchù: okna, rozvody, antény, servisní konstrukce, reflexe, stíny, zneèištìnı kov, rez, praskliny, šrámy od asteroidù... Jednotné silné svìtlo zleva, ostré stíny doprava...
Pomocné dladice: skelet (jen nosníky, rozvody), jen rùzné druhy povrchù/plášù
Moduly: 
2x2: Engine, Dok, velkı sférické zásobníky (více druhù), velké haly, velké verze (1x1 budov), ...
1x1: Greenhouse, Hospital, Cryobank, Canon, sférické zásobníky tekutin, sklady, Lab, Morque, Bank, SolarArray, Habitat, CommandPOst, Armory, ...
1x2 Administrativa, Armory, Parlament, haly, rafinerie, Recycler, Assembler, ... 
1x3 velké sklady, zásobníky, ...

Mùeš vymyslet svùj vlastní set, pokud umíš!
Do grafiky nepiš ádnı text (vıznam modulù musí bıt patrnı z grafiky)!

Paleta povolenıch barev:
FF0A0A10   ; 01 void-black
FF1A1E28   ; 02 hull-dark
FF2E3440   ; 03 hull-mid
FF4C5462   ; 04 hull-light
FF6A7080   ; 05 metal-gray
FF8A8E98   ; 06 metal-light
FFC0C4CC   ; 07 bright-metal
FFFF4848   ; 08 alert-red
FFFF8020   ; 09 warn-orange
FFFFC030   ; 10 warn-amber
FF60C060   ; 11 ok-green
FF4088C8   ; 12 info-blue
FF40C0C0   ; 13 coolant-cyan
FFB08030   ; 14 amber-dim
FFFFD060   ; 15 amber-bright
FFFFFFFF   ; 16 text-white
+ transparentní pozadí
Pokud neumíš transparentnost, pouij maskovací #ff00ff. 