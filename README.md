<h2 align="center">Chat-app-cnm-be <img src="https://media.giphy.com/media/rsUGLKwgSvSxmq1VrZ/giphy.gif" width="200"></h2>
<p align="center">
<img src="https://img.shields.io/badge/-JavaScript-black?style=flat-square&logo=javascript"/>
<img src="https://img.shields.io/badge/-Nodejs-black?style=flat-square&logo=Node.js"/>
<img src="https://img.shields.io/badge/-Expressjs-black?style=flat-square&logo=Express.js"/>
<img src="https://img.shields.io/badge/-MongoDB-black?style=flat-square&logo=mongodb"/>
<img src="https://img.shields.io/badge/-Git-black?style=flat-square&logo=git"/>
<img src="https://img.shields.io/badge/-GitHub-black?style=flat-square&logo=github"/>
</p>

## Express Router and Routes

## API DOMAIN: chat-app-cnm-be.vercel.app

| Route                           | HTTP Verb | Route Middleware    | Description                         | input                                                                                                             | ouput                                  |
| ------------------------------- | --------- | ------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| /api/v1/auth/register           | POST      | trim.all            | register user                       | { "name":"string", "phone":"string", "password":"string", "dateOfBirth":"yyyy-MM-DD", "gender":"male or female" } | {message,accessToken,usser:{info....}} |
| /api/v1/auth/login              | POST      | Đang cập nhật...... | Đang cập nhật......                 |                                                                                                                   |                                        |
| /api/v1/auth/loginWithEncrypted | POST      | Đang cập nhật...... | Đang cập nhật......                 | { phone, password }                                                                                               | Đang cập nhật......                    |
| /api/v1/auth/logout             | POST      | Đang cập nhật...... | Đang cập nhật......                 |
| /api/v1/auth/refreshToken       | GET       | Đang cập nhật...... |
| /api/v1/auth/refreshToken       | POST      | Đang cập nhật...... | Đang cập nhật......                 |
| /api/v1/conversation            | POST      | Đang cập nhật...... | open old or new conversation (chat) |                                                                                                                   |                                        |
| /api/v1/conversation            | GET       | Đang cập nhật...... | getListUserConversations            |
| /api/v1/message                 | POST      | Đang cập nhật...... | Đang cập nhật......                 |
| /api/v1/message/:conversationId | GET       | Đang cập nhật...... | Đang cập nhật......                 |
| /api/v1/user?search=keywork     | GET       | Đang cập nhật...... | search regex by name or phone       |
| /api/v1/user/info               | GET       | Đang cập nhật...... | Đang cập nhật......                 |
