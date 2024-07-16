import {faker} from '@faker-js/faker';
import post from '../fixtures/post.json';

let createdPostId;

describe('API tests', () => {



  it('Get all posts and verify HTTP status code and content type', () => {
    cy.request({
      method: 'GET',
      url: '/posts'
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.headers['content-type']).to.include('application/json');
      expect(response.body).to.have.length.above(0);

      post.forEach(expectedPost => {
        const foundPost = response.body.find(p => p.id === expectedPost.id);
        expect(foundPost).to.exist;
        expect(foundPost.title).to.eq(expectedPost.title);
        expect(foundPost.body).to.eq(expectedPost.body);
      });
    });
  });

  it('Get first 10 posts and verify HTTP status code', () => {
    cy.request({
      method: 'GET',
      url: '/posts',
      qs: {
        _limit: 10
      }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.lengthOf(10);
      for (let i = 0; i < 10; i++) {
        expect(response.body[i].id).to.eq(i + 1);
      }
    });
  });

  it('Get posts with id = 55 and id = 60 and verify HTTP status code and id values', () => {
    const idsToGet = [55, 60];

    idsToGet.forEach(id => {
      cy.request({
        method: 'GET',
        url: `/posts/${id}`
      }).then(response => {
        expect(response.status).to.eq(200);
        expect(response.body.id).to.eq(id);
      });
    });
  });


  it('Create a post and verify HTTP response status code.', () => {
    const newPost = {
      id: faker.datatype.number({min: 1, max: 100}),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(2)
    };

    cy.request({
      method: 'POST',
      url: '/664/posts',
      body: newPost,
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(401);
    });
  });

  it('Create post with adding access token in header. Verify HTTP response status code. Verify post is created.', () => {
    const postBody = {
      id: faker.datatype.number(),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(),
      userId: faker.datatype.number()
    };

    cy.request({
      method: 'POST',
      url: '/posts',
      headers: {
        'Authorization': `Bearer ${Cypress.env('accessToken')}`
      },
      body: postBody
    }).then(response => {

      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('id', postBody.id);
      expect(response.body).to.have.property('title', postBody.title);
      expect(response.body).to.have.property('body', postBody.body);
      expect(response.body).to.have.property('userId', postBody.userId);

      cy.log("Post created successfully");

      cy.request({
        method: 'GET',
        url: `/posts/${postBody.id}`,
        headers: {
          'Authorization': `Bearer ${Cypress.env('accessToken')}`
        }
      }).then(getResponse => {

        expect(getResponse.status).to.eq(200);
        expect(getResponse.body).to.have.property('id', postBody.id);
        expect(getResponse.body).to.have.property('title', postBody.title);
        expect(getResponse.body).to.have.property('body', postBody.body);
        expect(getResponse.body).to.have.property('userId', postBody.userId);
      });
    });
  });



  it('Create a post entity and verify that the entity is created, verify HTTP response status code. Use JSON in body.', () => {

    const postBody = {
      id: faker.datatype.number(),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs()
    };

    cy.request({
      method: 'POST',
      url: '/posts',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postBody),
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('id', postBody.id);
      expect(response.body).to.have.property('title', postBody.title);
      expect(response.body).to.have.property('body', postBody.body);
    });
  });

  it('Update non-existing entity. Verify HTTP response status code.', () => {

    const postBody = {
      id: faker.datatype.number(),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs()
    };

    cy.request({
      method: 'PUT',
      url: `/posts/${postBody.id}`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postBody),
      failOnStatusCode: false
    }).then(response => {
      expect(response.status).to.eq(404);
    });
  });


  let createdPostId;
  it('Create post entity and update the created entity. Verify HTTP response status code and verify that the entity is updated.', () => {


    cy.log("Create post");

    const postBody = {
      title: "Title",
      body: "itaque id aut magnamnpraesentium quia et ea odit et ea voluptas etnincidunt ea est distinctio odio"
    };

    cy.request({
      method: 'POST',
      url: '/posts',
      body: postBody,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(createResponse => {
      expect(createResponse.status).to.eq(201);
      createdPostId = createResponse.body.id; // сохраняем ID созданного поста

      expect(createResponse.body.title).to.eq(postBody.title);
      expect(createResponse.body.body).to.eq(postBody.body);

      cy.log("Update post");
      const updatedPostBody = {
        id: createdPostId,
        title: "Updated Title",
        body: "Updated body content."
      };

      cy.request({
        method: 'PUT',
        url: `/posts/${createdPostId}`,
        body: updatedPostBody,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(updateResponse => {
        expect(updateResponse.status).to.eq(200);
        expect(updateResponse.body.id).to.eq(createdPostId);
        expect(updateResponse.body.title).to.eq(updatedPostBody.title);
        expect(updateResponse.body.body).to.eq(updatedPostBody.body);
      });
    });

  });

  it('Delete non-existing post entity. Verify HTTP response status code.', () => {

    cy.request({
      method: 'DELETE',
      url: `/posts/${createdPostId}`
    }).then(response => {
      expect(response.status).to.eq(200);

      cy.request({
        method: 'GET',
        url: `/posts/${createdPostId}`,
        failOnStatusCode: false
      }).then(response => {
        expect(response.status).to.eq(404);
      });
    });
  });

  it('Create post entity, update the created entity, and delete the entity. Verify HTTP response status code and verify that the entity is deleted.', () => {
    let createdPostId;


    cy.log("Create post");

    const postBody = {
      id: faker.datatype.number(),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs()
    };

    cy.request({
      method: 'POST',
      url: '/posts',
      body: postBody,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(createResponse => {
      expect(createResponse.status).to.eq(201);
      createdPostId = createResponse.body.id;

      expect(createResponse.body.title).to.eq(postBody.title);
      expect(createResponse.body.body).to.eq(postBody.body);


      cy.log("Update post");

      const updatedPostBody = {
        id: createdPostId,
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs()
      };

      cy.request({
        method: 'PUT',
        url: `/posts/${createdPostId}`,
        body: updatedPostBody,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(updateResponse => {
        expect(updateResponse.status).to.eq(200);
        expect(updateResponse.body.id).to.eq(createdPostId);
        expect(updateResponse.body.title).to.eq(updatedPostBody.title);
        expect(updateResponse.body.body).to.eq(updatedPostBody.body);

        cy.log("Delete post");

        cy.request({
          method: 'DELETE',
          url: `/posts/${createdPostId}`
        }).then(deleteResponse => {
          expect(deleteResponse.status).to.eq(200);


          cy.request({
            method: 'GET',
            url: `/posts/${createdPostId}`,
            failOnStatusCode: false
          }).then(getResponse => {
            expect(getResponse.status).to.eq(404);
          });
        });
      });
    });
  });



})
