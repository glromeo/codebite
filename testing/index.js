const chai = require("chai");
const sinon = require("sinon");
const mockRequire = require("mock-require");

chai.use(require("sinon-chai"));

module.exports = {
    ...chai,
    ...sinon,
    mockRequire
}