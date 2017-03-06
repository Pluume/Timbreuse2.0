YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "client",
        "config",
        "csv",
        "db",
        "log",
        "math",
        "server",
        "server_methods",
        "slave"
    ],
    "modules": [
        "client",
        "config",
        "csv",
        "db",
        "log",
        "main",
        "math",
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
            "displayName": "log",
            "name": "log",
            "description": "Handle logging functions."
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