Lightweight local SMTP written in Typescript for automated testing, including integrations for various testing frameworks - prominently Playwright.                                                                                                                                                          

It captures incoming email in memory and gives you simple helpers to:

  - wait for a message
  - read a mailbox by recipient
  - clear mail state between tests
  - assert verification email flows
  - Why this exists
  - End-to-end tests often need real email behavior without external providers.
  - smtp-for-testing runs locally, accepts incoming mail, parses it, and stores it per recipient so your tests can assert real delivery behaviour.

Tech stack and relevant libraries
Runtime dependencies:

smtp-server: receives SMTP messages locally
mailparser: parses raw message streams into structured mail objects
nodemailer: useful for sending test messages into the local SMTP server
Development dependencies:

typescript
vitest
@types/node
@types/smtp-server
@types/mailparser

Install
```npm install smtp-for-testing```

Quick start
```
import { MailServer } from "smtp-for-testing";

const mailServer = new MailServer(2525);

await mailServer.start();

// run your app action that sends email...

const mail = await mailServer.waitForMail("user@example.com", 3000);
console.log(mail.subject);

await mailServer.stop();
```

License
ISC
