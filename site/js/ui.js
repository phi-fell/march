function getItemHTML(item) {
    let hover = '[' + item.name + ']';
    if (item.weapon_data) {
        hover += '\n - Weapon\n    - ' + (item.weapon_data.one_handed ? 'One Handed' : 'Two Handed') + '\n    - ' + "piercing: " + item.weapon_data.piercing + "\n    - " + "sharpness: " + item.weapon_data.sharpness + "\n    - " + "force: " + item.weapon_data.force + "\n    - " + "precision: " + item.weapon_data.precision + "\n    - " + "speed: " + item.weapon_data.speed;
    }
    if (item.armor_data) {
        hover += '\n - Armor\n' + "armor: " + item.armor_dataarmor + "\n    - " + "resilience " + item.armor_dataresilience + "\n    - " + "coverage: " + item.armor_datacoverage;
    }
    return '<span title="' + hover + '"><b>[' + item.name + ']</b></span>';
}
