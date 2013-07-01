/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * If applicable, add the following below this MPL 2.0 HEADER, replacing
 * the fields enclosed by brackets "[]" replaced with your own identifying
 * information:
 *     Portions Copyright [yyyy] [name of copyright owner]
 *
 *     Copyright 2013 ForgeRock AS
 *
 */
// START CONFIGURATION...

// client_secret is not used in the implicit profile
var redirect_uris = [
    server + openid + "/cb-basic.html",
    server + openid + "/cb-implicit.html"
];

// ...END CONFIGURATION
