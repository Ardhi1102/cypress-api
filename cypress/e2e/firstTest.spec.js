import { faker } from '@faker-js/faker';

describe('Test backend', () => {

  beforeEach('login to application', () => {
    cy.login()
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/tags', {fixture: 'tags.json'})
  })

  it.only('verify correct request and response', () => {
    const title = faker.lorem.words(3);
    const description = faker.lorem.words(3);
    const body = faker.lorem.words(3);

    cy.wrap({ title, description, body }).as('articleData');
    
    cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/').as('postArticles')

    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type(title)
    cy.get('[formcontrolname="description"]').type(description)
    cy.get('[formcontrolname="body"]').type(body)
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then(({ request , response }) => {
      cy.get('@articleData').then((article) => {
        console.log(request);
        console.log(response);
        expect(request.body.article.title).to.equal(article.title);
        expect(request.body.article.description).to.equal(article.description);
        expect(request.body.article.body).to.equal(article.body);

        expect(response.statusCode).to.equal(201);
        expect(response.body.article.title).to.equal(article.title);
        expect(response.body.article.description).to.equal(article.description);
        expect(response.body.article.body).to.equal(article.body);
      });
    });
  })

  it('verify popular tags are displayed', () => {
    cy.get('.tag-list')
      .should('contain', 'Test')
      .and('contain', 'GitHub')
      .and('contain', 'testing')
  })

  it('verify global feed likes count', () => {
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles/feed*', {"articles": [], "articlesCount":0})
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles*', { fixture: 'articles.json'})

    cy.contains('Global Feed').click()
    cy.get('app-article-list button').then(list => {
      expect(list[0]).to.contain('99')
      expect(list[1]).to.contain('999')
    })

    cy.fixture('articles').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 1000
      cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/'+articleLink+'/favorite', file)
    })
    cy.get('app-article-list button').eq(1).click().should('contain', '1000')
  })
})