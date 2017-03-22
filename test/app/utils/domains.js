export default {

  concatRecords(recsObj) {
    let recs = [];
    
    Object.keys(recsObj).forEach((rec) => {
      if(rec !== 'SOA'){
        recs.push(recsObj[rec] + ' ' + rec);
      }
    });

    return recs.join(' / ');
  }

};
