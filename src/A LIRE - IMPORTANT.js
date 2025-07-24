/* **********************************************************************************
*  Merci de me (Benzine) prévenir si vous voulez faire des modifications dans les scripts.
*  Je suis ouvert à la discussion, l'amélioration et la mise à jour du code mais ne le faites pas dans votre coin svp.
*
*  L'historique des scripts ne marche pas, donc pour éviter les soucis et garder trace des versions du code, je push ce que je fais sur un repo git
*  Faire des modifications sans me prévenir pourrait donnera lieu à la disparition de vos modifications lorsque je mettrai le code à jour depuis mon PC
*
*  Je me doute que tout n'est pas clean dans ce que j'ai fait et je vais essayer d'améliorer tout ça donc n'hésitez pas à faire des retours.
*
*  Merci d'avoir lu ♥
* **********************************************************************************/

function test()
{
	let dur1 = Duration.from_string( "5:59:59" );
	let dur2 = Duration.from_string( "0:00:02" );
	let dur3 = Duration.from_string( "-2:00:00" );
	let dur4 = Duration.from_string( "-10:00:00" );

	Logger.log( dur1.to_string() + " " + dur2.to_string() + " " + dur3.to_string() + " " + dur4.to_string() );

	let dur5 = Duration.add( dur1, dur2 );
	Logger.log( "%s + %s = %s", dur1.to_string(), dur2.to_string(), dur5.to_string() );

	dur5 = Duration.add( dur1, dur3 );
	Logger.log( "%s + %s = %s", dur1.to_string(), dur3.to_string(), dur5.to_string() );

	dur5 = Duration.add( dur1, dur4 );
	Logger.log( "%s + %s = %s", dur1.to_string(), dur4.to_string(), dur5.to_string() );

	dur5 = Duration.add( dur3, dur4 );
	Logger.log( "%s + %s = %s", dur3.to_string(), dur4.to_string(), dur5.to_string() );
}