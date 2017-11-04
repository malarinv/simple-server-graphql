module.exports = /* GraphQL */ `

type Query {
  unixTimestamp: Int!
}

type Mutation {
  generateSipToken: ID!
}

# type Subscription {
# }

type Schema {
  query: Query!
  mutation: Mutation!
  # subscription: Subscription!
}
`;
