describe('School Manager', function() {
  before(function() {
    cy.app('clean')
    cy.appFactories([
      ['create', 'staff', {
        password: 'password',
        email: 'staff@gmail.com'
      }],
      ['create', 'school_with_three_teachers']
    ])
    cy.login('staff@gmail.com', 'password')
  })

  beforeEach(function() {
    Cypress.Cookies.preserveOnce('_quill_session')
  })

  it('loads', function() {
    cy.visit('/cms/schools')
    cy.contains('School Directory')
  })

  after(function() {
    cy.logout()
  })
})
