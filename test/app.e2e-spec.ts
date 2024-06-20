import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';

import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

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

    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'hjavad@gmail.com',
      password: 'password',
    };

    describe('Sign up', () => {
      it('Should Throw Exception if no body passed', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if no Email Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if no Password Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if incorrect Email Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password, email: 'hjavadgamail.com' })
          .expectStatus(400); //.inspect();
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .stores('token', 'access_token'); //.inspect();
      });
    });

    describe('Sign in', () => {
      it('Should Throw Exception if no body passed', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if no Email Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if no Password Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(400); //.inspect();
      });

      it('Should Throw Exception if incorrect Email Provided ', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password, email: 'hjavadgamail.com' })
          .expectStatus(400); //.inspect();
      });

      it('should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('token', 'access_token'); //.inspect();
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://www.youtube.com/watch?v=d6WC5n9G_sM',
      };
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
          .expectJsonMatch({ id: '$S{bookmarkId}' }); //would have been the correct way of testing to prevent false positive matches with other numbers, user id etc.
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title:
          'Kubernetes Course - Full Beginners Tutorial (Containerize Your Apps!)',
        description:
          'Learn how to use Kubernetes in this complete course. Kubernetes makes it possible to containerize applications and simplifies app deployment to production.',
      };
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(204);
      });

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .withHeaders({
            Authorization: 'Bearer $S{token}',
          })
          .expectStatus(404);
        // .expectJsonLength(0);
      });
    });
  });

  describe('Users', () => {
    describe('Get me', () => {
      it('Should Get Me', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .expectStatus(200); //.inspect();
      });

      it('Should Edit User', () => {
        const dto: EditUserDto = {
          email: 'hjavad1234@gmail.com',
          firstName: 'mjavad',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({ Authorization: 'Bearer $S{token}' })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email); //.inspect();
      });
    });

    describe('Edit user', () => {});
  });
});
