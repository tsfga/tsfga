model
  schema 1.1

type user

type team
  relations
    define member: [user]

type document
  relations
    define blocked: [user]
    define editor: [user, team#member] but not blocked
