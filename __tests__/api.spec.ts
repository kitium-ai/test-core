import * as publicApi from '../src/public';

describe('public API surface', () => {
  it('matches snapshot', () => {
    expect(Object.keys(publicApi).sort()).toMatchSnapshot();
  });
});
