# Node.js download
https://nodejs.org/en/download/

# Node modules
Deze applicatie maakt gebruikt van node modules die niet meegegeven worden aan de repository. Ik gebruik de volgende node modules:
discord.js
dotenv

# Belangrijke technieken en standaarden

## Synchronizatie va de data met de json files
Json data wordt opgeslagen in lokale variabelen. Deze worden pas aangepast nadat er nieuwe data naar de relevante json files geschreven worden. Dit betekent
dat data niet automatisch gesynchronizeerd wordt met de bot wanneer een json file handmatig aangepast wordt (via een teksteditor in plaats van op Discord).
START DE BOT IN DIT GEVAL OPNIEUW OP, om fouten te voorkomen. DE ENIGE UITZONDERING VAN DIT OP DIT MOMENT IS DE SCHEDULE.JSON FILE.

## Controleren van reacties op berichten van de bot
Een bericht van de bot verwijderen telt als een reactie en vuurt dus het reactie event af. Om deze reden controleer ik of er een emoji gegeven wordt met
collected.first(). Als dit niet zo is betekend het dat de gebruiker het bericht verwijdert heeft, niet dat de gebruiker een reactie heeft geplaatst! Pas deze
techniek dus toe op toekomstige berichten die reacties van de gebruiker verwachten!

## Env file
Belangrijke informatie zoals de inlogtoken van de bot mogen niet op git gezet worden. Deze worden dus ook niet in json files opgeslagen. Voor dit soort
data gebruik ik env files. Omdat de env file niet op git staat moet deze handmatig gekopieerd worden naar het hostingplatform. Voor meer informatie zie:
https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/other-guides/env-files.md

## Tenor API
Om gifs te vinden gebruik ik de Tenor api. Deze verwacht een api key die je vooraf moet aanmaken. Voor meer informatie over het aanmaken van de api key zie
de link. Zorg er wel voor dat je de juiste endpoint gebruikt. De huidige api versie is al versie 2, deze moet dus ook benadered worden in de endpoint:
https://medium.com/swlh/build-your-first-discord-gif-bot-and-deploy-2cc917888113

## Bot inloggen
Om de bot te laten inloggen moet de bot key gebruikt worden. Deze staan in de env file. De code om mee in te loggen moet onderaan de code staan.
Gebruik de volgende lijn om in te loggen:
client.login(process.env.token);

# Aanpassingen pushen naar Heroku (het hostingplatform)
De bot wordt gehost op Heroku. Deze heeft om veiligheids redenen geen webverbinding met github (waar de code op staat). Om dit op te lossen
moet code gepusht worden naar github en vervolgens via git bash (command line) gepusht worden naar Heroku. Dit kan gedaan worden via de volgende stappen:
1. Commit en en push alle veranderingen.
2. Open git bash als administrator.
3. Ga naar de juiste map met de commando:
```
cd /d/discord\ bot/gw2bot  
```
(backslash staat voor een spatie)
4. Log in via de commando:  
```
heroku login
```
5. Log in via de browser en cancel de commando met ctrl + c (er bestaat een bug waardoor de commando bevriest na inloggen).
6. Benader de heroku app met de commando:  
```
heroku git:remote -a gw2phluntbot
```
7. Push de github repository naar de app met de commando:  
```
git push heroku main
```
8. PROFIT

Belangrijke links:
[tutorial voor alles behalve git bash](https://www.youtube.com/watch?v=Pck6JvLCBVk&ab_channel=TheBelgiumGames)
[de dashboard om de logs van de applicatie te zien en te debugge](https://dashboard.heroku.com/apps/gw2phluntbot/logs)
[hulp met de error waardoor Git Bash gebruikt moet worden](https://namespaceit.com/blog/items-could-not-be-retrieved-internal-server-error-heroku-and-github)

Minder belangrijk maar relevant:
https://www.youtube.com/watch?v=KD9OaryS1Kw&ab_channel=SalesforceDevelopers
(login error in Git Bash)[https://stackoverflow.com/questions/55955948/heroku-login-success-but-then-freezes]
(het gebruik van spaties in Git Bash)[https://apple.stackexchange.com/questions/14683/how-to-cd-to-a-directory-with-a-name-containing-spaces-in-bash]
https://stackoverflow.com/questions/39015893/heroku-deploy-error-cannot-find-module-app-index-js
