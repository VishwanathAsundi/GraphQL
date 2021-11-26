const { buildSchema } = require("graphql");

module.exports = buildSchema(`
type Post{
    _id:ID!
    content:String!
    title:String!
    imageUrl:String!
    creator:User!
    createdAT:String!
    updatedAt:String!
}
type User{
    _id:ID!
    email:String!
    name:String!
    password:String!
    posts:[Post!]!
}
input userInputData{
    email:String!
    name:String!
    password:String!
}
type RootMutation{
    createUser(userInput:userInputData):User!
}
type RootQuery{
    hello:String!
}
schema{
    query: RootQuery
    mutation:RootMutation
}
`);
