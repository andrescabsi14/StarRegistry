const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract("StarNotary", accs => {
	accounts = accs;
	owner = accounts[0];
});

it("can Create a Star", async () => {
	let starId = 1;
	let instance = await StarNotary.deployed();
	await instance.createStar("Awesome Star!", "SYM", starId, {
		from: accounts[0]
	});
	const createdStar = await instance.tokenIdToStarInfo.call(starId);
	assert.equal(createdStar.name, "Awesome Star!");
});

it("lets user1 put up their star for sale", async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let starId = 2;
	let starPrice = web3.utils.toWei(".01", "ether");
	await instance.createStar("awesome star", "SYM1", starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it("lets user1 get the funds after the sale", async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 3;
	let starPrice = web3.utils.toWei(".01", "ether");
	let balance = web3.utils.toWei(".05", "ether");
	await instance.createStar("awesome star", "SYM2", starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
	await instance.buyStar(starId, { from: user2, value: balance });
	let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
	let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
	let value2 = Number(balanceOfUser1AfterTransaction);
	assert.equal(value1, value2);
});

it("lets user2 buy a star, if it is put up for sale", async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 4;
	let starPrice = web3.utils.toWei(".01", "ether");
	let balance = web3.utils.toWei(".05", "ether");
	await instance.createStar("awesome star", "SYM3", starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
	await instance.buyStar(starId, { from: user2, value: balance });
	assert.equal(await instance.ownerOf.call(starId), user2);
});

it("lets user2 buy a star and decreases its balance in ether", async () => {
	let instance = await StarNotary.deployed();
	let user1 = accounts[1];
	let user2 = accounts[2];
	let starId = 5;
	let starPrice = web3.utils.toWei(".01", "ether");
	let balance = web3.utils.toWei(".05", "ether");
	await instance.createStar("awesome star", "SYM4", starId, { from: user1 });
	await instance.putStarUpForSale(starId, starPrice, { from: user1 });
	let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
	const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
	await instance.buyStar(starId, { from: user2, value: balance, gasPrice: 0 });
	const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
	let value =
		Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
	assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it("can add the star name and star symbol properly", async () => {
	let instance = await StarNotary.deployed();
	const myStar = {
		id: 7,
		name: "Vega",
		symbol: "VGA"
	};

	// 1. create a Star with different starId
	await instance.createStar(myStar.name, myStar.symbol, myStar.id, {
		from: accounts[0]
	});
	//2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
	const createdStarName = await instance.lookUptokenIdToStarInfo.call(
		myStar.id,
		false
	);
	const createdStarSymbol = await instance.lookUptokenIdToStarInfo.call(
		myStar.id,
		true
	);
	assert.equal(createdStarName, myStar.name);
	assert.equal(createdStarSymbol, myStar.symbol);
});

it("lets 2 users exchange stars", async () => {
	let instance = await StarNotary.deployed();
	const sampleStars = [
		{
			id: 8,
			name: "Capella",
			symbol: "CAP",
			creator: accounts[0]
		},
		{
			id: 9,
			name: "Beta Tauri",
			symbol: "BTA",
			creator: accounts[1]
		}
	];

	// 1. create 2 Stars with different starId
	sampleStars.map(async star => {
		await instance.createStar(star.name, star.symbol, star.id, {
			from: star.creator
		});
	});
	// 2. Call the exchangeStars functions implemented in the Smart Contract
	await instance.exchangeStars(sampleStars[0].id, sampleStars[1].id, {
		from: accounts[0]
	});
	// 3. Verify that the owners changed
	const star1Owner = await instance.ownerOf.call(sampleStars[0].id);
	const star2Owner = await instance.ownerOf.call(sampleStars[1].id);
	assert.equal(star1Owner, sampleStars[1].creator);
	assert.equal(star2Owner, sampleStars[0].creator);
});

it("lets a user transfer a star", async () => {
	let instance = await StarNotary.deployed();
	const myStar = {
		id: 10,
		name: "Upsilon",
		symbol: "UPS",
		creator: accounts[2]
	};
	// 1. create a Star with different starId
	await instance.createStar(myStar.name, myStar.symbol, myStar.id, {
		from: myStar.creator
	});
	// 2. use the transferStar function implemented in the Smart Contract
	const address2Transfer = accounts[3];
	await instance.transferStar(address2Transfer, myStar.id, {
		from: myStar.creator
	});

	// 3. Verify the star owner changed.
	const newStarOwner = await instance.ownerOf.call(myStar.id);
	assert.equal(newStarOwner, address2Transfer);
});

it("lookUptokenIdToStarInfo test", async () => {
	let instance = await StarNotary.deployed();
	const myStar = {
		id: 11,
		name: "Omega Aurigae",
		symbol: "OMA",
		creator: accounts[3]
	};
	// 1. create a Star with different starId
	await instance.createStar(myStar.name, myStar.symbol, myStar.id, {
		from: myStar.creator
	});

	// 2. Call your method lookUptokenIdToStarInfo
	const createdStarName = await instance.lookUptokenIdToStarInfo.call(
		myStar.id,
		false
	);

	// 3. Verify if you Star name is the same
	assert.equal(createdStarName, myStar.name);
});
