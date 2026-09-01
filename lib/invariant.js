// ../../deepseek-harness/plugins/dsh-usage-dashboard/src/invariant.ts
var PACKAGE_NAME = "dsh-usage-dashboard";
var name = "dsh-usage-dashboard-invariant";
var inject = ["invariants"];
var install = () => {
};
var apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=invariant.js.map
