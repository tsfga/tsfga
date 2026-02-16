model
  schema 1.1

type user
  relations
    define get: [user, service-account, team#member, role#assignee]
    define update: [user, service-account, team#member, role#assignee]
    define delete: [user, service-account, team#member, role#assignee]
    define resource_view: [user, service-account, team#member, role#assignee] or resource_edit
    define resource_edit: [user, service-account, team#member, role#assignee] or resource_admin
    define resource_admin: [user, service-account, team#member, role#assignee]
    define resource_get: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_view
    define resource_create: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_update: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_delete: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit

type service-account
  relations
    define get: [user, service-account, team#member, role#assignee]
    define update: [user, service-account, team#member, role#assignee]
    define delete: [user, service-account, team#member, role#assignee]
    define resource_view: [user, service-account, team#member, role#assignee] or resource_edit
    define resource_edit: [user, service-account, team#member, role#assignee] or resource_admin
    define resource_admin: [user, service-account, team#member, role#assignee]
    define resource_get: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_view
    define resource_create: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_update: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_delete: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit

type render

type anonymous

type role
  relations
    define assignee: [user, service-account, anonymous, team#member, role#assignee]
    define get: [user, service-account, team#member, role#assignee]
    define update: [user, service-account, team#member, role#assignee]
    define delete: [user, service-account, team#member, role#assignee]
    define resource_view: [user, service-account, team#member, role#assignee] or resource_edit
    define resource_edit: [user, service-account, team#member, role#assignee] or resource_admin
    define resource_admin: [user, service-account, team#member, role#assignee]
    define resource_get: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_view
    define resource_create: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_update: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_delete: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit

type team
  relations
    define admin: [user, service-account]
    define member: [user, service-account] or admin
    define get: [user, service-account, team#member, role#assignee] or member
    define update: [user, service-account, team#member, role#assignee] or admin
    define delete: [user, service-account, team#member, role#assignee] or admin
    define get_permissions: [user, service-account, team#member, role#assignee] or admin
    define set_permissions: [user, service-account, team#member, role#assignee] or admin
    define resource_view: [user, service-account, team#member, role#assignee] or resource_edit
    define resource_edit: [user, service-account, team#member, role#assignee] or resource_admin
    define resource_admin: [user, service-account, team#member, role#assignee]
    define resource_get: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_view
    define resource_create: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_update: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit
    define resource_delete: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit

type folder
  relations
    define parent: [folder]
    define admin: [user, service-account, team#member, role#assignee] or admin from parent
    define edit: [user, service-account, team#member, role#assignee] or edit from parent
    define view: [user, service-account, team#member, role#assignee] or view from parent
    define get: [user, service-account, team#member, role#assignee] or get from parent
    define create: [user, service-account, team#member, role#assignee] or create from parent
    define update: [user, service-account, team#member, role#assignee] or update from parent
    define delete: [user, service-account, team#member, role#assignee] or delete from parent
    define get_permissions: [user, service-account, team#member, role#assignee] or get_permissions from parent
    define set_permissions: [user, service-account, team#member, role#assignee] or set_permissions from parent
    define can_get: admin or edit or view or get
    define can_create: admin or edit or create
    define can_update: admin or edit or update
    define can_delete: admin or edit or delete
    define can_get_permissions: admin or get_permissions
    define can_set_permissions: admin or set_permissions
    define resource_view: [user, service-account, team#member, role#assignee] or resource_edit or resource_view from parent
    define resource_edit: [user, service-account, team#member, role#assignee] or resource_admin or resource_edit from parent
    define resource_admin: [user, service-account, team#member, role#assignee] or resource_admin from parent
    define resource_get: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_view or resource_get from parent
    define resource_create: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit or resource_create from parent
    define resource_update: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit or resource_update from parent
    define resource_delete: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_edit or resource_delete from parent
    define resource_get_permissions: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_admin or resource_get_permissions from parent
    define resource_set_permissions: [user with subresource_filter, service-account with subresource_filter, team#member with subresource_filter, role#assignee with subresource_filter] or resource_admin or resource_set_permissions from parent

type group_resource
  relations
    define view: [user, service-account, render, team#member, role#assignee] or edit
    define edit: [user, service-account, team#member, role#assignee] or admin
    define admin: [user, service-account, team#member, role#assignee]
    define get: [user, service-account, render, team#member, role#assignee] or view
    define create: [user, service-account, team#member, role#assignee] or edit
    define update: [user, service-account, team#member, role#assignee] or edit
    define delete: [user, service-account, team#member, role#assignee] or edit
    define get_permissions: [user, service-account, render, team#member, role#assignee] or admin
    define set_permissions: [user, service-account, render, team#member, role#assignee] or admin

type resource
  relations
    define view: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or edit
    define edit: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or admin
    define admin: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter]
    define get: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or view
    define update: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or edit
    define delete: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or edit
    define get_permissions: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or admin
    define set_permissions: [user with group_filter, service-account with group_filter, team#member with group_filter, role#assignee with group_filter] or admin

condition group_filter(requested_group: string, group_resource: string) {
  requested_group == group_resource
}

condition subresource_filter(subresource: string, subresources: list<string>) {
  subresource in subresources
}
