import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

import * as pactum from "pactum";
import { AuthDto } from '../src/auth/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, //disable extra fields in request body
      }),
    );

    await app.init();
    app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl("http://localhost:3333")
  });

  afterAll(() => {
    app.close();
  });

  describe("Auth", () => {
    const dto: AuthDto = {
      email: "hjavad@gmail.com",
      password: "password"
    }

    describe("Sign up", () => {

      it("Should Throw Exception if no body passed", () => {
        return pactum.spec().post("/auth/signup").expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if no Email Provided ", () => {
        return pactum.spec().post("/auth/signup").withBody({ password: dto.password }).expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if no Password Provided ", () => {
        return pactum.spec().post("/auth/signup").withBody({ email: dto.email }).expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if incorrect Email Provided ", () => {
        return pactum.spec().post("/auth/signup").withBody({ password: dto.password, email: "hjavadgamail.com" }).expectStatus(400);//.inspect();
      });

      it("Should sign up", () => {
        return pactum.spec().post("/auth/signup").withBody(dto).expectStatus(201)
          .stores('token', 'access_token');//.inspect();
      });
    });

    describe("Sign in", () => {


      it("Should Throw Exception if no body passed", () => {
        return pactum.spec().post("/auth/signin").expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if no Email Provided ", () => {
        return pactum.spec().post("/auth/signin").withBody({ password: dto.password }).expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if no Password Provided ", () => {
        return pactum.spec().post("/auth/signin").withBody({ email: dto.email }).expectStatus(400);//.inspect();
      });

      it("Should Throw Exception if incorrect Email Provided ", () => {
        return pactum.spec().post("/auth/signin").withBody({ password: dto.password, email: "hjavadgamail.com" }).expectStatus(400);//.inspect();
      });

      it("should sign in", () => {
        return pactum.spec().post("/auth/signin").withBody(dto).expectStatus(200);//.inspect();
      })
    });

  });

  describe("Users", () => {
    describe("Get me", () => { });
    describe("Edit user", () => { });
  });

  describe("Bookmarks", () => {
    describe("Get Bookmarks", () => { });
    describe("Get Bookmark by id", () => { });
    describe("Create Bookmark", () => { });
    describe("Edit Bookmark", () => { });
    describe("Delete Bookmark", () => { });
  });

});
