/**
 * Example Models
 * Define your reactive, persistent models here
 * 
 * Model class is available globally from the library (index.js)
 */

class User extends Model {
    id = null;
    name = "";
    email = "";
    role = "viewer";
    endpoint = "/api/user";

    fullName() {
        return this.name && this.email
            ? `${this.name} (${this.email})`
            : "No user info";
    }
}

class Settings extends Model {
    theme = "light";
    notifications = true;
    endpoint = "/api/settings";
}

// Create instances
export const user = new User("user");
export const settings = new Settings("settings");
