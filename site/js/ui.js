function getItemHTML(item) {
    let hover = '[' + item.name + ']';
    if (item.type === "WEAPON") {
        hover += '\n' + (item.one_handed ? 'One Handed' : 'Two Handed') + '\n' + "piercing: " + item.piercing + "\n" + "sharpness: " + item.sharpness + "\n" + "force: " + item.force + "\n" + "precision: " + item.precision + "\n" + "speed: " + item.speed;
    } else if (item.type === "APPAREL") {
        hover += '\n' + "armor: " + item.armor + "\n" + "resilience " + item.resilience + "\n" + "coverage: " + item.coverage;
    }
    return '<span title="' + hover + '"><b>[' + item.name + ']</b></span>';
}
