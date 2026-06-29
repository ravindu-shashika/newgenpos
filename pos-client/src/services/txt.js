export default {
  async nameString(nameStr) {
    let name = nameStr.toLowerCase();

    const periodSpaceSplit = name.split('. ');
    for (let i = 0; i < periodSpaceSplit.length; i++) {
      name = periodSpaceSplit.join('.');
    }

    const periodSplit = name.split('.');
    for (let i = 0; i < periodSplit.length; i++) {
      name = periodSplit.join('. ');
    }

    const spaceSplit = name.split(' ');
    for (let i = 0; i < spaceSplit.length; i++) {
      spaceSplit[i] =
        spaceSplit[i].charAt(0).toUpperCase() + spaceSplit[i].substring(1);
      name = spaceSplit.join(' ');
    }

    console.log(name);

    return name;
  },
};
