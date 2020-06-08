export interface DataBase {
  /**
   * An object that specifies the format for parsing the data.
   */
  // format?: DataFormat;
  /**
   * Provide a placeholder name and bind data at runtime.
   */
  name?: string;
}
export type InlineDataset = any[];
export interface InlineData extends DataBase {
  /**
   * The full data set, included inline. This can be an array of objects or primitive values, an object, or a string.
   * Arrays of primitive values are ingested as objects with a `data` property. Strings are parsed according to the specified format type.
   */
  value: InlineDataset;
}
export type DataSource = InlineData;
export type Data = DataSource;
