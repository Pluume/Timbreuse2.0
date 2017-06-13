YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "DataTable.Api",
        "client",
        "config",
        "csv",
        "db",
        "frontendHandle",
        "frontendUtil",
        "holidays",
        "informations",
        "leavereq",
        "log",
        "login",
        "math",
        "pages",
        "server",
        "server_methods",
        "slave"
    ],
    "modules": [
        "client",
        "config",
        "csv",
        "db",
        "frontendHandle",
        "frontendUtil",
        "holidays",
        "informations",
        "leavereq",
        "log",
        "login",
        "main",
        "math",
        "pages",
        "request",
        "server",
        "server_methods",
        "slave"
    ],
    "allModules": [
        {
            "displayName": "client",
            "name": "client",
            "description": "Handle client frontend."
        },
        {
            "displayName": "config",
            "name": "config",
            "description": "Handle the app config."
        },
        {
            "displayName": "csv",
            "name": "csv",
            "description": "Handle mathematics functions needed by the server."
        },
        {
            "displayName": "db",
            "name": "db",
            "description": "Handle the database"
        },
        {
            "displayName": "frontendHandle",
            "name": "frontendHandle",
            "description": "Handle the communication between electron's main process and electron's renderer process"
        },
        {
            "displayName": "frontendUtil",
            "name": "frontendUtil",
            "description": "Some useful function for the frontend process"
        },
        {
            "displayName": "holidays",
            "name": "holidays",
            "description": "Handle the timeoff functions"
        },
        {
            "displayName": "informations",
            "name": "informations",
            "description": "Handle the communication between electron's renderer process and electron's main process"
        },
        {
            "displayName": "leavereq",
            "name": "leavereq",
            "description": "Handle the leave applications function"
        },
        {
            "displayName": "log",
            "name": "log",
            "description": "Handle logging functions."
        },
        {
            "displayName": "login",
            "name": "login",
            "description": "Handle the login page to the server"
        },
        {
            "displayName": "main",
            "name": "main",
            "description": "Main module. Makes all the other modules start by parsing the command line argument."
        },
        {
            "displayName": "math",
            "name": "math",
            "description": "Handle mathematics functions needed by the server."
        },
        {
            "displayName": "pages",
            "name": "pages",
            "description": "Tiny module to know which page is currently displayed"
        },
        {
            "displayName": "request",
            "name": "request",
            "description": "Define some global enumeration used in network methods."
        },
        {
            "displayName": "server",
            "name": "server",
            "description": "Declare the Timbreuse's server and handle the client connection management. Redirect any request to the module server_methods"
        },
        {
            "displayName": "server_methods",
            "name": "server_methods",
            "description": "Handle the Timbreuse's server incoming data."
        },
        {
            "displayName": "slave",
            "name": "slave",
            "description": "Handle slave frontend."
        }
    ],
    "elements": []
} };
});