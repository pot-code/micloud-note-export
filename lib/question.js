const rl = require('readline');

const rli = rl.createInterface({
  input: process.stdin,
  output: process.stdout
});

rli.on('SIGINT', () => {
  rli.close();
});

function question_callback(rli, ques, res){
  let newline_count = ques.match(/\n/g);
  newline_count = newline_count || 0;

  // append the tips automatically
  rli.question(`${ques}[y/n](y)`, (ans) => {
    let input_invalid = false;
    switch (ans) {
      case '':
      case 'y':
      case 'Y':
      case 'yes':
      case 'Yes':
        ans = true; break;
      case 'n':
      case 'N':
      case 'no':
      case 'No':
        ans = false; break;
      default:
        input_invalid = true;
    }
    rli.pause();
    if (input_invalid) {
      // clear screen
      rl.moveCursor(process.stdout, 0, -(newline_count + 1));
      rl.clearScreenDown(process.stdout);

      // re-ask
      question_callback(rli, ques, res);
    }
    else {
      res(ans);
    }
  });
}

function question(ques) {
  return new Promise(res => {
    question_callback(rli, ques, res);
  });
}

module.exports = { rli, question };
