/*
 * @Author: Eduardo Policarpo
 * @contact: +55 43996611437
 * @Date: 2021-05-10 18:09:49
 * @LastEditTime: 2021-06-07 03:18:01
 */
const express = require('express');
const Router = express.Router();
const engine = require('../engines/WhatsappWebJS');
const Sessions = require('../controllers/sessions');
const Mensagens = require('../functions/WhatsappWebJS/mensagens');
const Status = require('../functions/WhatsappWebJS/status');
const config = require('../config');
const { checkParams } = require('../middlewares/validations');
const { checkNumber } = require('../middlewares/checkNumber');
const firebase = require('../firebase/db');
const firestore = firebase.firestore();

Router.post('/start', async (req, res) => {

    if (req.headers['apitoken'] === config.token) {
        let session = req.body.session
        let existSession = Sessions.checkSession(session)
        if (!existSession) {
            init(session)
        }
        if (existSession) {
            let data = Sessions.getSession(session)
            if (data.status !== 'inChat' && data.status !== 'isLogged') {
                init(session)
            }
            else {
                res.status(400).json({
                    result: 400,
                    "status": "FAIL",
                    "reason": "there is already a session with that name",
                    "status": data.status
                })
            }
        }

        async function init(session) {
            Sessions.checkAddUser(session)
            Sessions.addInfoSession(session, {
                apitoken: req.headers['apitoken'],
                sessionkey: req.headers['sessionkey'],
                wh_status: req.body.wh_status,
                wh_message: req.body.wh_message,
                wh_qrcode: req.body.wh_qrcode,
                wh_connect: req.body.wh_connect,
                wa_browser_id: req.headers['wa_browser_id'] ? req.headers['wa_browser_id'] : '',
                wa_secret_bundle: req.headers['wa_secret_bundle'] ? req.headers['wa_secret_bundle'] : '',
                wa_token_1: req.headers['wa_token_1'] ? req.headers['wa_token_1'] : '',
                wa_token_2: req.headers['wa_token_2'] ? req.headers['wa_token_2'] : '',
            })

            let response = await engine.start(req, res, session)

            let data = {
                'session': session,
                'apitoken': req.headers['apitoken'],
                'wh_status': req.body.wh_status,
                'wh_message': req.body.wh_message,
                'wh_qrcode': req.body.wh_qrcode,
                'wh_connect': req.body.wh_connect,
                'WABrowserId': response.WABrowserId,
                'WASecretBundle': response.WASecretBundle,
                'WAToken1': response.WAToken1,
                'WAToken2': response.WAToken2
            }
            await firestore.collection('Sessions').doc(session).set(data);

            res.status(200).json({
                "result": 200,
                "status": "CONNECTED",
                "response": 'Sessão gravada com sucesso no Firebase'
            })
        }
    }
    else {
        req.io.emit('msg', {
            result: 400,
            "status": "FAIL",
            "reason": "Unauthorized, please check the API TOKEN"
        })
        res.status(401).json({
            result: 401,
            "status": "FAIL",
            "reason": "Unauthorized, please check the API TOKEN"
        })
    }

})

// Mensagens
Router.post('/sendText', checkParams, checkNumber, Mensagens.sendText);
Router.post('/sendImage', checkNumber, Mensagens.sendImage);
Router.post('/sendVideo', checkNumber, Mensagens.sendVideo);
Router.post('/sendSticker', checkNumber, Mensagens.sendSticker);
Router.post('/sendFile', checkNumber, Mensagens.sendFile);
// Router.post('/sendFile64', Mensagens.sendFile64);
Router.post('/sendAudio', Mensagens.sendAudio);
// Router.post('/sendVoiceBase64', Mensagens.sendVoiceBase64);
Router.post('/sendLink', checkNumber, Mensagens.sendLink);
Router.post('/sendContact', checkNumber, Mensagens.sendContact);
Router.post('/sendLocation', checkNumber, Mensagens.sendLocation);

// // Grupos
// Router.post('/getAllGroups', Groups.getAllGroups);
// Router.post('/joinGroup', Groups.joinGroup);
// Router.post('/createGroup', Groups.createGroup);
// Router.post('/leaveGroup', Groups.leaveGroup);
// Router.post('/getGroupMembers', Groups.getGroupMembers);
// Router.post('/addParticipant', Groups.addParticipant);
// Router.post('/removeParticipant', Groups.removeParticipant);
// Router.post('/promoteParticipant', Groups.promoteParticipant);
// Router.post('/demoteParticipant', Groups.demoteParticipant);
// Router.post('/getGroupAdmins', Groups.getGroupAdmins);
// Router.post('/getGroupInviteLink', Groups.getGroupInviteLink);
// Router.post('/setGroupPic', Groups.setGroupPic);

// // Status
Router.post('/sendTextToStorie', Status.sendTextToStorie);
//Router.post('/sendImageToStorie', Status.sendImageToStorie);
//Router.post('/sendVideoToStorie', Status.sendVideoToStorie);

// // Dispositivo, chats entre outras
// Router.post('/getBatteryLevel', Commands.getBatteryLevel);
// Router.post('/getConnectionState', Commands.getConnectionState);
// Router.post('/getHostDevice', Commands.getHostDevice);
// Router.post('/getAllContacts', Commands.getAllContacts);
// Router.post('/getBlockList', Commands.getBlockList);
// Router.post('/getMessagesChat', Commands.getMessagesChat);
// Router.post('/getProfilePic', Commands.getProfilePic);
// Router.post('/verifyNumber', Commands.verifyNumber);
// Router.post('/deleteChat', Commands.deleteChat);
// Router.post('/clearChat', Commands.clearChat);
// Router.post('/archiveChat', Commands.archiveChat);
// Router.post('/deleteMessage', Commands.deleteMessage);
// Router.post('/reply', Commands.reply);
// Router.post('/forwardMessages', Commands.forwardMessages);
// Router.post('/markUnseenMessage', Commands.markUnseenMessage);
// Router.post('/blockContact', Commands.blockContact);
// Router.post('/unblockContact', Commands.unblockContact);
// Router.post('/getNumberProfile', Commands.getNumberProfile);

module.exports = Router;