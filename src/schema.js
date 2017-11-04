module.exports = /* GraphQL */ `

scalar JSON

type Query {
  unixTimestamp: Int!
}


input GenerateSipConfigInput {
  phoneNumber: String!
}

type GenerateSipConfigPayload {
  config: JSON
}

type Mutation {
  generateSipConfig(input: GenerateSipConfigInput!): GenerateSipConfigPayload!
}

# type Subscription {
# }

type Schema {
  query: Query!
  mutation: Mutation!
  # subscription: Subscription!
}
`;
