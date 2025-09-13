import spider, { insertData, insertOne, normalizeBust } from "../src/app/libs/data"
import data from "../json/all/all_girls_details.json" with {type: "json"};
async function spide_jimei() {
    await spider.testLoadAllCitiesGirlsData()
    await spider.testSaveAllGirlsDetails()

    const map_data = data.map((girl) => {
        const girl_id = girl.id
        delete girl.id;
        let bust = girl.bust
        if (bust) {
            bust = normalizeBust(bust)
        }
        return {
            ...girl,
            rank_bust: bust,
            girl_id
        }
    });

    for (let i = 0; i < map_data.length; i++) {
        const item = map_data[i]
        await insertOne(item)
    }

}
spide_jimei()