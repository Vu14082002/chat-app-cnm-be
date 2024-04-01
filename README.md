<h2 align="center">Chat-app-cnm-be <img src="https://media.giphy.com/media/rsUGLKwgSvSxmq1VrZ/giphy.gif" width="200"></h2>

<p align="center">
    <img src="https://img.shields.io/badge/-JavaScript-black?style=flat-square&logo=javascript"/>
    <img src="https://img.shields.io/badge/-Nodejs-black?style=flat-square&logo=Node.js"/>
    <img src="https://img.shields.io/badge/-Socket.io-black?style=flat-square&logo=Socket.io"/>
    <img src="https://img.shields.io/badge/-Expressjs-black?style=flat-square&logo=Express.js"/>
    <img src="https://img.shields.io/badge/-MongoDB-black?style=flat-square&logo=mongodb"/>
    <img src="https://img.shields.io/badge/-Git-black?style=flat-square&logo=git"/>
    <img src="https://img.shields.io/badge/-GitHub-black?style=flat-square&logo=github"/>
</p>

## API Routes

### Authentication

| Route                       | Method | Middleware | Description          | Input                                                                                                               | Output                                   |
| --------------------------- | ------ | ---------- | -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/api/v1/auth/createOTP`    | POST   | trim.all   | Create OTP           | `{ "phone":"lllllllll" }`                                                                                           |                                          |
| `/api/v1/auth/verifyOTP`    | POST   | trim.all   | Verify OTP           | `{"phone":"anhthaodev@gmail.com","otp":"482831"}`                                                                   | ``                                       |
| `/api/v1/auth/register`     | POST   | trim.all   | Register user        | `{ "name":"string", "phone":"string", "password":"string", "dateOfBirth":"yyyy-MM-DD", "gender":"male or female" }` | `{message,accessToken,user:{info....}}`  |
| `/api/v1/auth/login`        | POST   | -          | Login user           | `{ "phone":"string", "password":"string" }`                                                                         | `{message,accessToken,user:{info....}}`  |
| `/api/v1/auth/logout`       | POST   | -          | Logout user          |                                                                                                                     | `{ message: "Logged out successfully" }` |
| `/api/v1/auth/refreshToken` | GET    | -          | Refresh access token |                                                                                                                     | `{message,accessToken,user:{info....}}`  |
| `/api/v1/auth/refreshToken` | POST   | -          | Refresh access token |                                                                                                                     | `{message,accessToken,user:{info....}}`  |

### Conversation

| Route                  | Method | Middleware | Description                         | Input | Output                             |
| ---------------------- | ------ | ---------- | ----------------------------------- | ----- | ---------------------------------- |
| `/api/v1/conversation` | POST   | -          | Open old or new conversation (chat) |       | `{ conversationId, messages: [] }` |
| `/api/v1/conversation` | GET    | -          | Get list user conversations         |       | `{ conversations: [] }`            |

### Message

| Route                             | Method | Middleware | Description                    | Input | Output                                     |
| --------------------------------- | ------ | ---------- | ------------------------------ | ----- | ------------------------------------------ |
| `/api/v1/message`                 | POST   | -          | Send message                   |       | `{ message: "Message sent successfully" }` |
| `/api/v1/message/:conversationId` | GET    | -          | Get messages of a conversation |       | `{ messages: [] }`                         |

### User

| Route                         | Method | Middleware      | Description                   | Input                          | Output                                       |
| ----------------------------- | ------ | --------------- | ----------------------------- | ------------------------------ | -------------------------------------------- |
| `/api/v1/user?search=keywork` | GET    | -               | Search users by name or phone |                                | `{ users: [] }`                              |
| `/api/v1/user/info`           | GET    | -               | Get current user info         |                                | `{ user: {...} }`                            |
| `/api/v1/user/addfriend`      | POST   | checkAuthorized | Add friend by ID              | `{ "friendId": "[id]" }`       | `{ message: "Friend added successfully" }`   |
| `/api/v1/user/deletefriend`   | DELETE | checkAuthorized | Delete friend by ID           | `{ "friendId": "[id]" }`       | `{ message: "Friend deleted successfully" }` |
| `/api/v1/user/updateAvatar`   | PUT    | checkAuthorized | Update user avatar            | `{ "avatar": "[avatar_url]" }` | `{ message: "Avatar updated successfully" }` |
