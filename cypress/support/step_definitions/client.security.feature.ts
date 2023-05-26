import {Then} from "@badeball/cypress-cucumber-preprocessor";
import {EventStream} from "../ldes";

Then('the collection at {string} is forbidden', (url: string) => {
    new EventStream(url).waitForResponseCode(403);
})
