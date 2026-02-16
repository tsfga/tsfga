model
  schema 1.1

type user

type workspace
  relations
    define legacy_admin: [user]
    define channels_admin: [user] or legacy_admin
    define member: [user] or channels_admin
    define guest: [user]

type channel
  relations
    define writer: [user, workspace#member]
    define commenter: [user, workspace#member] or writer
