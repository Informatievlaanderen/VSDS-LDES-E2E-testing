import { Member } from "./member";

/**
 * Interface abstracting a storage for LDES members.
 */

export interface IStorage {
    /**
     * Returns the member type name.
     */
     get storageTypeName(): string;

     /**
     * Returns the member type name.
     */
     get memberTypeName(): string;

    /**
     * Perform any required initialization.
     */
    initialize(): Promise<void>;

    /**
     * Perform any required termination.
     */
    terminate(): Promise<void>;

    /**
     * Returns the number of members in the store.
     */
    count(): Promise<number>;

    /**
     * Returns the N last member IDs
     */
    lastIds(maxCount: number): Promise<string[]>;

    /**
     * Returns the member for the given id or undefined if not found.
     */
    member(id: string): Promise<Member | undefined>;

    /**
     * Returns true if the member exists, false otherwise.
     */
    exists(id: string): Promise<boolean>;

    /**
     * Inserts or updates the member with the given ID.
     * Returns the ID.
     */
    insertOrUpdate(id: string, member: Member): Promise<string>;

    /**
     * Deletes all members.
     * Returns the number of members deleted.
     */
    deleteAll(): Promise<number>;
}
