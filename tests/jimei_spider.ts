import spider, { insertOne, mapData, normalizeBust } from "../src/app/libs/data"
import data from "../json/all/all_girls_details.json" with {type: "json"};
async function spide_jimei() {
    await spider.testLoadAllCitiesGirlsData()
    await spider.testSaveAllGirlsDetails()


    const map_data = mapData(data);

    for (let i = 0; i < map_data.length; i++) {
        const item = map_data[i]
        const girl={id:item.girl_id,...item}
        await insertOne(girl)
    }

}
spide_jimei()