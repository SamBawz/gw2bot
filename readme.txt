Json data wordt opgeslagen in lokale variabelen. Deze worden pas aangepast nadat er nieuwe data naar de relevante json files geschreven worden. Dit betekent
dat data niet automatisch gesynchronizeerd wordt met de bot wanneer een json file handmatig aangepast wordt. START DE BOT IN DIT GEVAL OPNIEUW OP, om fouten
te voorkomen. DE ENIGE UITZONDERING VAN DIT OP DIT MOMENT IS DE SCHEDULE.JSON FILE.


Een bericht van de bot verwijderen telt als een reactie en vuurt dus het reactie event af. Om deze reden controleer ik of er een emoji gegeven wordt met collected.first()
Als dit niet zo is betekend het dat de gebruiker het bericht verwijdert heeft, niet dat de gebruiker een reactie heeft geplaatst!
