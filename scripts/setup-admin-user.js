"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/setup-admin-user.ts
var admin = require("firebase-admin");
var fs = require("fs");
var path = require("path");
// Path to your service account key file relative to the project root
var serviceAccountPath = path.resolve(__dirname, '../bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');
var targetEmail = 'augusto.devcode@gmail.com';
var targetRoleName = 'ADMINISTRATOR';
// Ensure the Admin SDK is initialized
var dbAdmin;
var authAdmin;
function initializeAdminSDK() {
    return __awaiter(this, void 0, void 0, function () {
        var app, serviceAccount, app;
        return __generator(this, function (_a) {
            if (admin.apps.length > 0) {
                console.log('[Admin Script] Firebase Admin SDK already initialized.');
                app = admin.apps[0];
                dbAdmin = app.firestore();
                authAdmin = app.auth();
                return [2 /*return*/];
            }
            console.log('[Admin Script] Initializing Firebase Admin SDK...');
            if (!fs.existsSync(serviceAccountPath)) {
                console.error("[Admin Script] CRITICAL ERROR: Service account key file NOT FOUND at: ".concat(serviceAccountPath));
                console.error('[Admin Script] Please ensure the file name is correct and it exists at the project root.');
                process.exit(1); // Exit if key file is missing
            }
            try {
                serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    // projectId: serviceAccount.project_id, // Optional, but good practice
                });
                console.log('[Admin Script] Firebase Admin SDK initialized successfully.');
                dbAdmin = app.firestore();
                authAdmin = app.auth();
            }
            catch (error) {
                console.error('[Admin Script] CRITICAL ERROR during Admin SDK initialization:', error);
                process.exit(1); // Exit on initialization failure
            }
            return [2 /*return*/];
        });
    });
}
function getRoleByName(roleName) {
    return __awaiter(this, void 0, void 0, function () {
        var rolesRef, q, snapshot, roleDoc, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!dbAdmin) {
                        console.error('[Admin Script] Firestore Admin DB not available to getRoleByName.');
                        return [2 /*return*/, null];
                    }
                    console.log("[Admin Script] Looking for role: ".concat(roleName));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    rolesRef = dbAdmin.collection('roles');
                    q = rolesRef.where('name', '==', roleName).limit(1);
                    return [4 /*yield*/, q.get()];
                case 2:
                    snapshot = _a.sent();
                    if (!snapshot.empty) {
                        roleDoc = snapshot.docs[0];
                        console.log("[Admin Script] Found role '".concat(roleName, "' with ID: ").concat(roleDoc.id));
                        return [2 /*return*/, __assign({ id: roleDoc.id }, roleDoc.data())];
                    }
                    else {
                        console.warn("[Admin Script] Role '".concat(roleName, "' not found in Firestore."));
                        // Optional: You might want to create the default roles if they are missing
                        return [2 /*return*/, null];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("[Admin Script] Error fetching role '".concat(roleName, "':"), error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function setupAdminUser() {
    return __awaiter(this, void 0, void 0, function () {
        var adminRole, userRecord, userExistsInAuth, error_2, createError_1, userDocRef, userDoc, userProfileData, updatePayload, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, initializeAdminSDK()];
                case 1:
                    _b.sent();
                    // Ensure SDK is available after initialization
                    if (!dbAdmin || !authAdmin) {
                        console.error('[Admin Script] Admin SDK not available after initialization attempt. Exiting.');
                        process.exit(1);
                    }
                    console.log("[Admin Script] Setting up user ".concat(targetEmail, " as ").concat(targetRoleName, "..."));
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 19, , 20]);
                    return [4 /*yield*/, getRoleByName(targetRoleName)];
                case 3:
                    adminRole = _b.sent();
                    if (!adminRole) {
                        console.error("[Admin Script] Could not find the '".concat(targetRoleName, "' role. Please ensure default roles exist in Firestore."));
                        process.exit(1); // Cannot proceed without the role
                    }
                    userRecord = void 0;
                    userExistsInAuth = false;
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 13]);
                    return [4 /*yield*/, authAdmin.getUserByEmail(targetEmail)];
                case 5:
                    userRecord = _b.sent();
                    userExistsInAuth = true;
                    console.log("[Admin Script] User found in Firebase Auth with UID: ".concat(userRecord.uid));
                    return [3 /*break*/, 13];
                case 6:
                    error_2 = _b.sent();
                    if (!(error_2.code === 'auth/user-not-found')) return [3 /*break*/, 11];
                    console.log("[Admin Script] User ".concat(targetEmail, " not found in Firebase Auth. Creating..."));
                    _b.label = 7;
                case 7:
                    _b.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, authAdmin.createUser({
                            email: targetEmail,
                            emailVerified: false, // You can set this based on your needs
                            disabled: false,
                            // Optional: Add a temporary password if needed for initial login, but be mindful of security
                            // password: 'temporary-password',
                        })];
                case 8:
                    userRecord = _b.sent();
                    console.log("[Admin Script] User created in Firebase Auth with UID: ".concat(userRecord.uid));
                    return [3 /*break*/, 10];
                case 9:
                    createError_1 = _b.sent();
                    console.error("[Admin Script] Error creating user ".concat(targetEmail, " in Auth:"), createError_1);
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 12];
                case 11:
                    console.error("[Admin Script] Error checking user ".concat(targetEmail, " in Auth:"), error_2);
                    process.exit(1);
                    _b.label = 12;
                case 12: return [3 /*break*/, 13];
                case 13:
                    userDocRef = dbAdmin.collection('users').doc(userRecord.uid);
                    return [4 /*yield*/, userDocRef.get()];
                case 14:
                    userDoc = _b.sent();
                    userProfileData = {
                        uid: userRecord.uid,
                        email: userRecord.email, // Email is guaranteed to exist if we created or found the user
                        fullName: userRecord.displayName || targetEmail.split('@')[0], // Use display name if available, otherwise part of email
                        roleId: adminRole.id,
                        roleName: adminRole.name,
                        permissions: adminRole.permissions || [],
                        status: 'ATIVO', // Assuming active status
                        habilitationStatus: 'HABILITADO', // Habilitado for admin
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    if (!(!userExistsInAuth || !userDoc.exists)) return [3 /*break*/, 16];
                    // User document doesn't exist in Firestore, create it
                    console.log("[Admin Script] User document for UID ".concat(userRecord.uid, " not found in Firestore. Creating..."));
                    userProfileData.createdAt = admin.firestore.FieldValue.serverTimestamp();
                    return [4 /*yield*/, userDocRef.set(userProfileData)];
                case 15:
                    _b.sent();
                    console.log("[Admin Script] User document for UID ".concat(userRecord.uid, " created in Firestore."));
                    return [3 /*break*/, 18];
                case 16:
                    // User document exists, update it
                    console.log("[Admin Script] User document for UID ".concat(userRecord.uid, " found in Firestore. Updating..."));
                    updatePayload = {
                        roleId: adminRole.id,
                        roleName: adminRole.name,
                        permissions: adminRole.permissions || [],
                        habilitationStatus: 'HABILITADO',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        // Remove legacy 'role' field if it exists
                        role: admin.firestore.FieldValue.delete(),
                    };
                    // Keep existing fullName if it exists and is not empty, unless we just created the user in Auth
                    if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fullName) && typeof userDoc.data().fullName === 'string' && userDoc.data().fullName.trim() !== '' && userExistsInAuth) {
                        // Don't update fullName if it existed and we just updated
                        delete updatePayload.fullName;
                    }
                    else {
                        // Use the name from Auth record if we just created/synced Auth, or if Firestore name was missing/empty
                        updatePayload.fullName = userRecord.displayName || targetEmail.split('@')[0];
                    }
                    return [4 /*yield*/, userDocRef.update(updatePayload)];
                case 17:
                    _b.sent();
                    console.log("[Admin Script] User document for UID ".concat(userRecord.uid, " updated in Firestore with ADMIN role."));
                    _b.label = 18;
                case 18:
                    console.log("[Admin Script] Setup for ".concat(targetEmail, " as ").concat(targetRoleName, " completed successfully."));
                    return [3 /*break*/, 20];
                case 19:
                    error_3 = _b.sent();
                    console.error("[Admin Script] An error occurred during admin user setup for ".concat(targetEmail, ":"), error_3);
                    process.exit(1);
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/];
            }
        });
    });
}
// Execute the script
setupAdminUser();
