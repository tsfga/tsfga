model
  schema 1.1

type user

type timeslot
  relations
    define user: [user]

type ip-address-range
  relations
    define user: [user]

type branch
  relations
    define account_manager: [user]
    define approved_ip_address_range: [ip-address-range]
    define approved_timeslot: [timeslot]
    define approved_context: user from approved_timeslot and user from approved_ip_address_range

type account
  relations
    define branch: [branch]
    define account_manager: account_manager from branch
    define customer: [user]
    define account_manager_viewer: account_manager and approved_context from branch
    define viewer: customer or account_manager_viewer
    define can_view: viewer

type transaction
  relations
    define account: [account]
    define can_view: viewer from account
