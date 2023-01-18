const fs = require('fs');
const pg = require("pg");
const simpleParser = require('mailparser').simpleParser;
const quotedPrintable = require('quoted-printable');


runApp();

function extractBase64Strings(text) {
    let base64Strings = [];
    let startIndex;
    let endIndex;
    let startString;
    let endString;
    let base64String;

    while (text.includes("Content-Transfer-Encoding: base64")) {
        startIndex = text.indexOf("Content-Transfer-Encoding: base64");
        endIndex = text.indexOf("--");
        startString = text.indexOf("base64", startIndex);
        endString = text.indexOf("--", startIndex);
        base64String = text.slice(startString + 7, endString).trim();
        const buff = Buffer.from(base64String, 'base64');

        // decode buffer as UTF-8
        const str = buff.toString('utf-8');

        base64Strings.push(str);
        text = text.slice(endIndex + 2);
    }

    return base64Strings;
}

async function runApp() {
    //Your PostgreSQL connection string
    const cs = 'postgres://postgres:postgres@localhost:5432/messages';
    const fileDirectory = "C:\\Users..."

    const client = new pg.Client(cs);
    client.connect();


    for (const file of fs.readdirSync(fileDirectory)) {
        //console.log(file);
        let filePath = fileDirectory + file;
        try {
            var currentMessageFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            //Grab the topicId of the current JSON object
            var topicId = currentMessageFile["topicId"];

            let insertTopic = false;

            const sql = 'select topicid from public.topics t where topicid = $1';
            const values = [topicId];
            try {
                const res = await client.query(sql, values)
                if (res.rows.length == 1) {
                    //all good
                } else if (res.rows.length == 0) {
                    insertTopic = true;
                } else {
                    console.log("Multiple topics for: " + topicId);
                }
            } catch (err) {
                console.log(err.stack)
            }

            if (insertTopic) {
                if ((!currentMessageFile.subject.startsWith("RE:")) && (!currentMessageFile.subject.startsWith("Re:"))) {
                    const query2 = 'INSERT INTO public.topics(topicid, subject) VALUES($1, $2)'
                    const values2 = [topicId, currentMessageFile.subject]

                    client.query(query2, values2, (err, res) => {
                        if (err) {
                            console.log(err.stack)
                        }
                    })
                }
            }

            let parsed = await simpleParser(currentMessageFile.rawEmail);

            let text = "";
            if (parsed.text) {
                text = parsed.text;
            } else {
                let string = currentMessageFile.rawEmail.split(/Content-Transfer-Encoding:.*\r\n/);

                let result = currentMessageFile.rawEmail.includes("base64");

                if (result) {

                    let bstring = extractBase64Strings(currentMessageFile.rawEmail);

                    let stringCombo = "";
                    for (let i = 0; i < bstring.length; i++) {
                        console.log(bstring[i]);
                        if (!stringCombo.includes(bstring[i])) {
                            stringCombo += bstring[i];
                        }
                    }
                    text = stringCombo;
                } else {
                    text = quotedPrintable.decode(string[1]);
                }
                if (currentMessageFile.msgId === 1231) {
                    console.log(currentMessageFile.rawEmail);
                }
            }

            const query3 = 'INSERT INTO public.messages\n' +
                '            (nummessagesintopic, nextintime, \n' +
                '                senderid, systemmessage, subject, messagefrom, \n' +
                '                authorname, msgsnippet, msgid, rawemail, profile, \n' +
                '                userid, previntime, contenttrasformed, postdate, nextintopic, previntopic, topicid)\n' +
                '            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);'
            const values3 = [currentMessageFile.numMessagesInTopic, currentMessageFile.nextInTime,
                currentMessageFile.senderId, currentMessageFile.systemMessage, currentMessageFile.subject,
                currentMessageFile.from, currentMessageFile.authorName, currentMessageFile.msgSnippet, currentMessageFile.msgId,
                text, currentMessageFile.profile, currentMessageFile.userId, currentMessageFile.prevInTime,
                currentMessageFile.contentTrasformed, currentMessageFile.postDate, currentMessageFile.nextInTopic, currentMessageFile.prevInTopic, currentMessageFile.topicId];

            client.query(query3, values3, (err, res) => {
                if (err) {
                    console.log(err.stack)
                }
            })
        } catch (e) {
            console.log("failed on " + file);
            console.log(e);
        }
    }

}