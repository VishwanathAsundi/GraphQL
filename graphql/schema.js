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
input postInputData{
    title:String!
    content:String!
    imageUrl:String!
}
type PostData{
    posts:[Post!]!
    totalPosts:Int!
}
type UserData{
    token:String!
    userId:ID!
}
type RootMutation{
    createUser(userInput:userInputData):User!
    createPost(postInput:postInputData):Post!
}
type RootQuery{
    login(email:String!,password:String!):UserData!
    posts:PostData!
}
schema{
    query: RootQuery
    mutation:RootMutation
}
`);
