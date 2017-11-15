module.exports = /* GraphQL */`

scalar JSON

# headers: auth

type User {
  displayName: String!
  id: String!
}

type Query {
  unixTimestamp: Int!
  user: User
  loginUrl: String!
}


input GenerateSipConfigInput {
  phoneNumber: String!
}

type GenerateSipConfigPayload {
  config: JSON
}

type Mutation {
  generateSipConfig(input: GenerateSipConfigInput!): GenerateSipConfigPayload!
  verifyToken(input: String!): Boolean!
}

# type Subscription {
# }

type Schema {
  query: Query!
  mutation: Mutation!
  # subscription: Subscription!
}
`;
