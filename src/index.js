import Immutable from 'immutable';
import { InheritableMap } from 'inheritable-map';

/**
 * Used to identify tables inside JSON blobs
 */
const TABLE_JSON_ID = '__IMMUTABLE-TABLE';

/**
 * Represents a data table in memory. Immutable
 *
 * This implementation uses nexted hash tables to represent rows/columns.  The
 * advantage of this is that a table with no data can take almost no space.  As
 * the table becomes filled, it will occupy more memory.
 */
export class Table extends InheritableMap {

  /**
   * Makes a reviver function to be used to deserialize Tables using JSON.parse.
   *
   * Serialization can be done using JSON.stringify(table)
   * @param  {function} [wrappedReviver] optionally specify another reviver
   * @return {function}
   */
  static makeReviver(wrappedReviver) {
    return (key, value) => {
      let newValue = value;
      if (wrappedReviver) {
        newValue = wrappedReviver(key, newValue);
      }

      if (newValue[TABLE_JSON_ID] !== undefined) {
        const object = JSON.parse(newValue[TABLE_JSON_ID]);
        const map = Immutable.fromJS(object)
          .update('data', data => data
            .mapKeys(x => parseInt(x, 10))
            .map(values => values
              .mapKeys(y => parseInt(y, 10))
            )
          );

        // Copy to Table instance
        const table = new Table(map.get('width'), map.get('height'));
        return table.set('data', map.get('data'));
      }
      return newValue;
    };
  }

  /**
   * Create a table from a CSV representation
   * @param  {string} csv comma separated value representation
   * @return {Table}
   */
  static fromCSV(csv) {
    let width = 0;
    const lines = csv
      .split('\n')
      .map(line => {
        const newLine = line
          .split(',')
          .map(x => x.trim());
        width = Math.max(width, newLine.length);
        return newLine;
      });
    let table = new Table(width, lines.length);
    lines.forEach((line, y) => {
      line.forEach((item, x) => {
        table = table.setCell(x, y, item);
      });
    });
    return table;
  }

  /**
   * Public constructor
   * @param  {number} width
   * @param  {number} height
   */
  constructor(width, height) {
    super();
    return this
      .set('width', width)
      .set('height', height)
      .set('data', new Immutable.Map());
  }

  /**
   * The width of the table
   * @return {number}
   */
  get width() {
    return this.get('width');
  }

  /**
   * The height of the table
   * @return {number}
   */
  get height() {
    return this.get('height');
  }

  /**
   * Gets a value in the table
   * @param {number} x        column index.  Negative numbers can be used to
   *                          address columns from the right side of the table.
   * @param {number} y        row index. Negative numbers can be used to address
   *                          rows from the bottom side of the table.
   * @return {any}
   */
  getCell(x, y, defaultValue) {
    [x, y] = this._validate(x, y);
    return this.getIn(['data', x, y], defaultValue);
  }

  /**
   * Sets a value or values in the table.
   * @param {number} x        column index.  Negative numbers can be used to
   *                          address columns from the right side of the table.
   * @param {number} y        row index. Negative numbers can be used to address
   *                          rows from the bottom side of the table.
   * @param {any|Table} value value to set in the table.  If the value is a
   *                          table, the values of that table are used to set
   *                          the equavalent set of cells in the destination at
   *                          the offset specified.
   * @return {Table}          derived table
   */
  setCell(x, y, value) {
    [x, y] = this._validate(x, y);
    if (value instanceof Table) {
      if (value.width + x > this.width) throw new Error('table overflows x dimension');
      if (value.height + y > this.height) throw new Error('table overflows y dimension');
      return this.mergeDeep(
        value
          .delete('width')
          .delete('height')
          .update('data', data => data
            .mapKeys(fromX => fromX + x)
            .filter((_, fromX) => fromX < this.width)
            .map(map => map
              .mapKeys(fromY => fromY + y)
              .filter((_, fromY) => fromY < this.height)
            )
          )
      );
    }
    return this.setIn(['data', x, y], value);
  }

  /**
   * Get a subset of the table
   * @param  {number} startX the left most column index of the subset.  Negative
   *                         numbers can be used to address columns from the
   *                         right side of the table.
   * @param  {number} startY the top most row of the subset.  Negative numbers
   *                         can be used to address rows from the bottom side of
   *                         the table.
   * @param  {number} [endX] the right most column index, exclusive, of the
   *                         subset.  Negative numbers can be used to address
   *                         columns from the right side of the table.
   * @param  {number} [endY] the bottom most row index, exclusive, of the
   *                         subset.  Negative numbers can be used to address
   *                         rows from the bottom side of the table.
   * @return {Table}         subset
   */
  slice(startX, startY, endX, endY) {
    [startX, startY] = this._validate(startX, startY);

    // If a right isn't defined, use the right edge and bottom edge for x/y lims
    if (endX === undefined) {
      endX = this.width;
      endY = this.height;
    } else {
      [endX, endY] = this._validate(endX, endY);
    }

    return this
      .set('width', endX - startX)
      .set('height', endY - startY)
      .update('data', data => data
        .filter((values, fromX) => startX <= fromX && fromX < endX)
        .mapKeys(fromX => fromX - startX)
        .map(map => map
          .filter((values, fromY) => startY <= fromY && fromY < endY)
          .mapKeys(fromY => fromY - startY)
        )
      );
  }

  /**
   * Serialize the table to a JSON representation.
   *
   * Deserialization can be done using the static Table.makeReviver() function
   * in combination with JSON.parse();
   * @return {string} JSON representation
   */
  toJSON() {
    const serialized = {};
    serialized[TABLE_JSON_ID] = JSON.stringify(this.toJS());
    return serialized;
  }

  /**
   * Converts negative indicies into positive ones and also validates indices.
   *
   * Throws if coordinates are invalid.
   * @param  {number} x column index, can be negative
   * @param  {number} y row index, can be negative
   * @return {number[]} tuple of x, y indicies
   */
  _validate(x, y) {
    if (x < 0) x += this.width;
    if (y < 0) y += this.height;
    if (x >= this.width) throw new Error('x larger than table width');
    if (y >= this.height) throw new Error('y larger than table height');
    if (x < 0) throw new Error('x less than 0');
    if (y < 0) throw new Error('y less than 0');
    return [x, y];
  }

  /**
   * Create a friendly string representation of the Table
   * @return {string}
   */
  toString() {
    return this.__toString('Table {', '}');
  }
}
