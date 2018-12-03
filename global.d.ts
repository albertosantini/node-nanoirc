import { Client } from "irc-upd";
import { EventEmitter } from "events";

declare module "irc-upd" {
    export interface Client extends EventEmitter {
    }
}
